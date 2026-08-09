import { companyFinancialsSchema, companyMetaSchema } from "@/lib/schemas";
import {
  checkSicEligibility,
  fetchCompanyFacts,
  fetchSubmissions,
  mapToFinancials,
  resolveCik,
  type EdgarClient,
} from "./edgar";
import type { CompanyResolutionResult } from "./types";

export type ResolveCompanyOptions = {
  tier?: "featured" | "searched";
  peerTickers?: string[];
  yearsWanted?: number;
};

function networkErrorResult(error: unknown): CompanyResolutionResult {
  const message = error instanceof Error ? error.message : String(error);
  return { status: "network-error", reason: `Couldn't reach SEC EDGAR: ${message}` };
}

/**
 * The core resolution pipeline given an already-known CIK+ticker:
 * eligibility → retrieve → normalize → validate. Shared by the exact-
 * ticker path (`resolveCompany`, the offline Featured pipeline) and the
 * ticker-or-name Search path (`searchCompany`) — one implementation, not
 * two (CLAUDE.md — "shared SEC EDGAR layer for both"). Never throws for an
 * expected failure (a network/SEC-reachability problem resolves to
 * `status: "network-error"`, not an exception) — only ever returns
 * `status: "success"` once the built `CompanyFinancials` has passed
 * `companyFinancialsSchema.parse` — nothing else is allowed to reach the
 * engine (Phase 3 brief item 10).
 */
export async function resolveCompanyByCik(
  client: EdgarClient,
  cik: string,
  ticker: string,
  options: ResolveCompanyOptions = {}
): Promise<CompanyResolutionResult> {
  const yearsWanted = options.yearsWanted ?? 5;

  let submissions: Awaited<ReturnType<typeof fetchSubmissions>>;
  try {
    submissions = await fetchSubmissions(client, cik);
  } catch (error) {
    return networkErrorResult(error);
  }

  const eligibility = checkSicEligibility(submissions.sic);
  if (!eligibility.eligible) {
    return { status: "unsupported", reason: eligibility.reason, sicCode: submissions.sic };
  }

  let companyFacts: Awaited<ReturnType<typeof fetchCompanyFacts>>;
  try {
    companyFacts = await fetchCompanyFacts(client, cik);
  } catch (error) {
    return networkErrorResult(error);
  }

  const mapped = mapToFinancials(companyFacts, yearsWanted);
  if (mapped.status === "insufficient-data") {
    return { status: "insufficient-data", reason: mapped.reason, missingFields: mapped.missingFields };
  }

  const financialsCandidate = { historicals: mapped.historicals, currentPrice: null };
  const financialsParsed = companyFinancialsSchema.safeParse(financialsCandidate);
  if (!financialsParsed.success) {
    return {
      status: "insufficient-data",
      reason: `Normalized data failed schema validation: ${financialsParsed.error.message}`,
    };
  }

  const metaCandidate = {
    ticker: ticker.trim().toUpperCase(),
    cik,
    name: submissions.name,
    sector: submissions.sicDescription,
    sicCode: submissions.sic,
    description: `${submissions.name} — SIC ${submissions.sic} (${submissions.sicDescription})`,
    tier: options.tier ?? "searched",
    peerTickers: options.peerTickers ?? [],
  };
  const metaParsed = companyMetaSchema.safeParse(metaCandidate);
  if (!metaParsed.success) {
    return {
      status: "insufficient-data",
      reason: `Company metadata failed schema validation: ${metaParsed.error.message}`,
    };
  }

  return {
    status: "success",
    meta: metaParsed.data,
    financials: financialsParsed.data,
    provenance: mapped.provenance,
  };
}

/**
 * Exact-ticker company resolution — used by the offline Featured dataset
 * pipeline. `searchCompany` (Phase 5) is the ticker-or-name counterpart for
 * the live Search tier; both end in `resolveCompanyByCik`.
 */
export async function resolveCompany(
  client: EdgarClient,
  ticker: string,
  options: ResolveCompanyOptions = {}
): Promise<CompanyResolutionResult> {
  let resolved: { cik: string; name: string } | null;
  try {
    resolved = await resolveCik(client, ticker);
  } catch (error) {
    return networkErrorResult(error);
  }

  if (!resolved) {
    return { status: "not-found", reason: `No SEC-registered company found for ticker "${ticker}".` };
  }

  return resolveCompanyByCik(client, resolved.cik, ticker, options);
}
