import { resolveCik, searchCompanyByName, type EdgarClient } from "./edgar";
import { resolveCompanyByCik, type ResolveCompanyOptions } from "./resolveCompany";
import { withCache, type DataCache } from "./cache";
import type { CompanyResolutionResult } from "./types";

export type SearchCompanyOptions = ResolveCompanyOptions & {
  /** Read-through/write-through cache for the resolved result, keyed by ticker (Phase 5 brief item 7). */
  cache?: DataCache;
};

/** How long a resolved company (success or a stable failure) stays cached — SEC filing data doesn't change intraday. */
const SEARCH_CACHE_TTL_SECONDS = 600;

/**
 * The Search-tier orchestrator (Architecture §13 `searchCompany.ts`):
 * resolves a user's query — ticker OR company name — to a CIK, then runs
 * the exact same core `resolveCompany` (the Featured pipeline) uses
 * (`resolveCompanyByCik`) — never a second implementation of eligibility/
 * retrieval/normalization/validation.
 *
 * A query that exactly matches a known ticker is resolved as a ticker
 * first; only if that fails does it fall back to a company-name search, so
 * a short name that also happens to collide with an unrelated ticker still
 * resolves the way a user typing a real ticker would expect.
 */
export async function searchCompany(
  client: EdgarClient,
  query: string,
  options: SearchCompanyOptions = {}
): Promise<CompanyResolutionResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { status: "not-found", reason: "Enter a company name or ticker to search." };
  }

  let identifier: { cik: string; ticker: string } | null;
  try {
    const byTicker = await resolveCik(client, trimmed);
    identifier = byTicker
      ? { cik: byTicker.cik, ticker: trimmed.toUpperCase() }
      : await searchCompanyByName(client, trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "network-error", reason: `Couldn't reach SEC EDGAR: ${message}` };
  }

  if (!identifier) {
    return { status: "not-found", reason: `No SEC-registered company found matching "${trimmed}".` };
  }

  const { cache, ...resolveOptions } = options;
  const cacheKey = `company:${identifier.ticker.toUpperCase()}`;

  return withCache(cache, cacheKey, SEARCH_CACHE_TTL_SECONDS, () =>
    resolveCompanyByCik(client, identifier.cik, identifier.ticker, {
      ...resolveOptions,
      tier: resolveOptions.tier ?? "searched",
    })
  );
}
