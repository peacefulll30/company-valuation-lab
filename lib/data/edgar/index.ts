export { createEdgarClient, DEFAULT_USER_AGENT, EdgarFetchError, type EdgarClient, type EdgarClientOptions, type FetchImpl } from "./client";
export { resolveCik, searchCompanyByName } from "./tickerIndex";
export { fetchCompanyFacts, fetchSubmissions } from "./companyFacts";
export { checkSicEligibility, type SicEligibilityResult } from "./sicEligibility";
export { mapToFinancials, type FieldProvenance, type MapToFinancialsResult } from "./mapToFinancials";
export {
  selectAnnualFacts,
  selectInstantFacts,
  collectAnnualFactsByTagPriority,
  collectInstantFactsByTagPriority,
  selectFiscalYearEnds,
} from "./selectFacts";
export * from "./xbrlTags";
export type { CompanyFactsResponse, SubmissionsResponse, TickerIndexResponse, XbrlConceptFacts, XbrlFactEntry } from "./types";
