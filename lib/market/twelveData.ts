import { z } from "zod";
import type { MarketQuoteResult } from "./types";

/**
 * Live market price via Twelve Data (`/quote`), chosen after checking the
 * free-tier terms of the realistic options: Finnhub's free tier serves
 * real-time quotes but paywalls historical candles (403 on `/stock/
 * candle`); Alpha Vantage's free tier is capped at ~25 requests/day, too
 * thin for a real product. Twelve Data's free tier (800 requests/day,
 * 8/min) covers both a current quote and — in a later pass — historical
 * daily prices from one provider from one key.
 *
 * Server-only: the API key never reaches the client (CLAUDE.md — secrets
 * stay in Route Handlers/Server Components). Missing key -> immediately
 * "unavailable", never a fabricated/estimated price, never a network call
 * with no key. Uses Next's own fetch cache (`next.revalidate`) rather than
 * a hand-rolled cache — the Featured company pages are statically
 * generated (`generateStaticParams`), so this is what keeps the price from
 * being frozen at build time while still protecting the daily request
 * budget (a 15-minute window is far more than enough for a valuation
 * tool's WACC/market-cap context, not a trading terminal).
 *
 * Licensing: Twelve Data's terms (https://twelvedata.com/terms) govern
 * redisplay of this data — free-tier data is for personal/development use,
 * and any production or public deployment of this app must hold a plan
 * whose usage terms actually permit that redisplay. This module only ever
 * labels the result "Latest available price," never "real-time" (see
 * `MarketQuote.isRealTime` — always `false` here, since Twelve Data's
 * response carries no field confirming real-time delivery on this plan);
 * that label must stay accurate to whatever plan is actually configured.
 */
const BASE_URL = "https://api.twelvedata.com";
const SOURCE = "Twelve Data";
const FETCH_TIMEOUT_MS = 8000;
const QUOTE_REVALIDATE_SECONDS = 15 * 60;

const quoteSchema = z.object({
  currency: z.string().optional(),
  close: z.coerce.number().finite(),
  // Twelve Data may return either/both; parsed defensively since neither is
  // guaranteed — a missing provider timestamp degrades to `asOf` (our own
  // fetch time) in the UI, never a fabricated one.
  timestamp: z.coerce.number().optional(),
  datetime: z.string().optional(),
});

const errorShapeSchema = z.object({
  status: z.literal("error").optional(),
  code: z.number().optional(),
  message: z.string().optional(),
});

function readApiKey(): string | null {
  const key = process.env.TWELVE_DATA_API_KEY;
  return key && key.trim().length > 0 ? key : null;
}

function tickerLooksValid(ticker: string): boolean {
  return /^[A-Za-z][A-Za-z.\-]{0,9}$/.test(ticker);
}

/** Prefers the unambiguous unix-epoch `timestamp`; falls back to `datetime` only if it parses to a real date. Never fabricates one when neither is usable. */
function deriveProviderTimestamp(timestamp: number | undefined, datetime: string | undefined): string | null {
  if (typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp > 0) {
    return new Date(timestamp * 1000).toISOString();
  }
  if (datetime) {
    const parsedDate = new Date(datetime);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate.toISOString();
  }
  return null;
}

/** Fetches the latest quote for a ticker. Never throws — every failure mode resolves to `{ status: "unavailable", reason }`. */
export async function fetchQuote(ticker: string): Promise<MarketQuoteResult> {
  const apiKey = readApiKey();
  if (!apiKey) {
    return { status: "unavailable", reason: "Market data isn't configured for this deployment yet." };
  }
  if (!tickerLooksValid(ticker)) {
    return { status: "unavailable", reason: "Not a valid ticker for a market-price lookup." };
  }

  try {
    const response = await fetch(`${BASE_URL}/quote?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: QUOTE_REVALIDATE_SECONDS },
    });
    const body: unknown = await response.json().catch(() => null);

    const errorShape = errorShapeSchema.safeParse(body);
    if (errorShape.success && (errorShape.data.status === "error" || (errorShape.data.code ?? 0) >= 400)) {
      console.error("[market] Twelve Data quote error:", errorShape.data.message ?? `status ${response.status}`);
      return { status: "unavailable", reason: "The market data service couldn't return a price right now." };
    }

    const parsed = quoteSchema.safeParse(body);
    if (!response.ok || !parsed.success) {
      console.error("[market] Twelve Data quote unexpected response:", response.status);
      return { status: "unavailable", reason: "The market data service returned an unexpected response." };
    }

    return {
      status: "ok",
      quote: {
        price: parsed.data.close,
        // The whole product is scoped to SEC-filing (US-listed) companies —
        // USD is the correct default when the provider omits currency, not
        // a guess (CLAUDE.md — "no multi-currency" is a V1 boundary, not an
        // invitation to fabricate a currency code).
        currency: parsed.data.currency ?? "USD",
        asOf: new Date().toISOString(),
        providerTimestamp: deriveProviderTimestamp(parsed.data.timestamp, parsed.data.datetime),
        source: SOURCE,
        isRealTime: false,
      },
    };
  } catch (error) {
    console.error("[market] quote fetch failed:", error instanceof Error ? error.message : error);
    return { status: "unavailable", reason: "Couldn't reach the market data service." };
  }
}
