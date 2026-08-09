import type { EdgarClient } from "./client";
import type { CompanyFactsResponse, SubmissionsResponse } from "./types";

/** `cik` must already be zero-padded to 10 digits (see `tickerIndex.ts::resolveCik`). */
export async function fetchCompanyFacts(client: EdgarClient, cik: string): Promise<CompanyFactsResponse> {
  return client.fetchJson<CompanyFactsResponse>(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
}

/** Entity metadata (SIC code, name, filing history) — used by the eligibility check. */
export async function fetchSubmissions(client: EdgarClient, cik: string): Promise<SubmissionsResponse> {
  return client.fetchJson<SubmissionsResponse>(`https://data.sec.gov/submissions/CIK${cik}.json`);
}
