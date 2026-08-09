import type { EdgarClient } from "./client";
import type { TickerIndexResponse } from "./types";

const TICKER_INDEX_URL = "https://www.sec.gov/files/company_tickers.json";

function pad10(cik: number): string {
  return String(cik).padStart(10, "0");
}

// The ticker index is one static ~800KB file shared by every ticker lookup
// in a process — memoized per client so resolving N tickers (e.g. the
// Featured pipeline's 10) fetches it once, not N times.
const indexCache = new WeakMap<EdgarClient, Promise<TickerIndexResponse>>();

function fetchTickerIndex(client: EdgarClient): Promise<TickerIndexResponse> {
  const cached = indexCache.get(client);
  if (cached) return cached;

  const promise = client.fetchJson<TickerIndexResponse>(TICKER_INDEX_URL);
  indexCache.set(client, promise);
  return promise;
}

/** Resolves a ticker (case-insensitive) to its SEC CIK, or `null` if unknown to EDGAR. */
export async function resolveCik(
  client: EdgarClient,
  ticker: string
): Promise<{ cik: string; name: string } | null> {
  const index = await fetchTickerIndex(client);
  const wanted = ticker.trim().toUpperCase();

  for (const entry of Object.values(index)) {
    if (entry.ticker.toUpperCase() === wanted) {
      return { cik: pad10(entry.cik_str), name: entry.title };
    }
  }

  return null;
}

/**
 * Best-effort company-*name* search across the ticker index (Phase 5 —
 * "support search by ticker and company name"). Ranked exact title match >
 * title starts-with query > title contains query; `null` if nothing
 * plausible matches. A simple, local substring match — no external search
 * service — consistent with the rest of `/lib/data/edgar` staying keyless.
 */
export async function searchCompanyByName(
  client: EdgarClient,
  query: string
): Promise<{ cik: string; ticker: string; name: string } | null> {
  const index = await fetchTickerIndex(client);
  const wanted = query.trim().toLowerCase();
  if (!wanted) return null;

  let startsWith: { cik_str: number; ticker: string; title: string } | undefined;
  let contains: { cik_str: number; ticker: string; title: string } | undefined;

  for (const entry of Object.values(index)) {
    const title = entry.title.toLowerCase();
    if (title === wanted) {
      return { cik: pad10(entry.cik_str), ticker: entry.ticker, name: entry.title };
    }
    if (!startsWith && title.startsWith(wanted)) startsWith = entry;
    if (!contains && title.includes(wanted)) contains = entry;
  }

  const match = startsWith ?? contains;
  return match ? { cik: pad10(match.cik_str), ticker: match.ticker, name: match.title } : null;
}
