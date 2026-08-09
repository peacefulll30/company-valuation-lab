import { getFeaturedCompany } from "@/lib/featured";
import { searchCompany } from "@/lib/data/searchCompany";
import { getSearchCache, getSearchEdgarClient } from "@/lib/data/searchInfra";
import { toCompanyWorkspaceRecord, type CompanyWorkspaceRecord } from "@/lib/data/types";

export type WorkspaceCompanyError = {
  status: "not-found" | "unsupported" | "insufficient-data" | "network-error";
  reason: string;
};

export type WorkspaceCompanyResolution = { record: CompanyWorkspaceRecord } | { error: WorkspaceCompanyError };

/**
 * Resolves a `companySlug` to real data: Featured first (static, instant),
 * else the live Search-tier pipeline treating the slug as an exact ticker
 * — which is always true for a searched company, since search only ever
 * redirects to `/valuation/{ticker}/...` (never a name-based URL). Cached,
 * so a company that was just searched doesn't trigger a second SEC
 * round-trip. The single implementation shared by the workspace layout and
 * the AI Analyst chat route (Architecture §9 — the server re-derives this
 * itself on every turn rather than trusting a client-supplied slug/state).
 */
export async function resolveWorkspaceCompany(companySlug: string): Promise<WorkspaceCompanyResolution> {
  const featured = getFeaturedCompany(companySlug);
  if (featured) return { record: featured };

  const result = await searchCompany(getSearchEdgarClient(), companySlug, {
    cache: getSearchCache(),
    tier: "searched",
  });

  if (result.status === "success") {
    return { record: toCompanyWorkspaceRecord(result) };
  }
  return { error: { status: result.status, reason: result.reason } };
}
