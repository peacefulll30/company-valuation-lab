import { NextResponse } from "next/server";
import { z } from "zod";
import { searchCompany } from "@/lib/data/searchCompany";
import { getSearchCache, getSearchEdgarClient } from "@/lib/data/searchInfra";
import { checkRateLimit, getSearchRateLimiter, retryAfterSeconds } from "@/lib/rateLimit";

/**
 * Search-tier entry point (Architecture §13 `/api/search/route.ts`).
 * Server-only work (SEC retrieval) stays here, never in the client
 * component (CLAUDE.md). Returns the same 5-state discriminated union
 * `searchCompany` produces, minus the full `CompanyFinancials` payload —
 * on success the client only gets the ticker and navigates to that
 * company's workspace, which re-derives/re-reads the validated data
 * server-side itself (never trusts a client-supplied blob, matching the
 * AI Analyst grounding rule's spirit).
 *
 * Rate-limited per IP (Architecture §9 — no auth in V1) via the shared
 * `lib/rateLimit` guardrail; a generous limit since a search costs us only
 * a SEC lookup, not a paid API call.
 */
const requestSchema = z.object({ query: z.string().max(200) });

export async function POST(request: Request) {
  const rateLimitOutcome = await checkRateLimit(request, getSearchRateLimiter);
  if (rateLimitOutcome && !rateLimitOutcome.success) {
    return NextResponse.json(
      { status: "rate-limited", reason: "Too many searches in a short time. Wait a moment and try again for" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rateLimitOutcome)) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "not-found", reason: "Invalid request body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success || !parsed.data.query.trim()) {
    return NextResponse.json(
      { status: "not-found", reason: "Enter a company name or ticker to search." },
      { status: 400 }
    );
  }

  const result = await searchCompany(getSearchEdgarClient(), parsed.data.query, {
    cache: getSearchCache(),
    tier: "searched",
  });

  if (result.status === "success") {
    return NextResponse.json({ status: "success", ticker: result.meta.ticker, name: result.meta.name });
  }

  return NextResponse.json({ status: result.status, reason: result.reason });
}
