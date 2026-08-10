import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchQuote } from "@/lib/market/twelveData";
import { checkRateLimit, getMarketRateLimiter, retryAfterSeconds } from "@/lib/rateLimit";

/**
 * The client-side Refresh control's endpoint — `fetchQuote` itself is
 * server-only (the Twelve Data key never reaches the browser). Server
 * rendering (the layout, for WACC weighting / Overview) calls `fetchQuote`
 * directly instead of round-tripping through this route.
 */
const querySchema = z.object({ ticker: z.string().regex(/^[A-Za-z][A-Za-z.\-]{0,9}$/) });

export async function GET(request: Request) {
  const rateLimitOutcome = await checkRateLimit(request, getMarketRateLimiter);
  if (rateLimitOutcome && !rateLimitOutcome.success) {
    return NextResponse.json(
      { status: "unavailable", reason: "Too many price checks in a short time — wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rateLimitOutcome)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ ticker: searchParams.get("ticker") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ status: "unavailable", reason: "Missing or invalid ticker." }, { status: 400 });
  }

  const result = await fetchQuote(parsed.data.ticker.toUpperCase());
  return NextResponse.json(result);
}
