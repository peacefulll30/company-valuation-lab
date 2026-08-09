/** Raw shapes returned by SEC EDGAR's public JSON APIs — subset actually used. */

export type XbrlFactEntry = {
  /** Present for duration (income-statement/cash-flow) concepts; absent for instant (balance-sheet) concepts. */
  start?: string;
  end: string;
  val: number;
  accn: string;
  fy: number;
  fp: string;
  form: string;
  filed: string;
  frame?: string;
};

export type XbrlConceptFacts = {
  label?: string;
  description?: string;
  units: Record<string, XbrlFactEntry[]>;
};

/** `GET https://data.sec.gov/api/xbrl/companyfacts/CIK{10-digit}.json` */
export type CompanyFactsResponse = {
  cik: number;
  entityName: string;
  facts: {
    "us-gaap"?: Record<string, XbrlConceptFacts>;
    dei?: Record<string, XbrlConceptFacts>;
  };
};

/** `GET https://data.sec.gov/submissions/CIK{10-digit}.json` (subset). */
export type SubmissionsResponse = {
  cik: string;
  name: string;
  sic: string;
  sicDescription: string;
  tickers: string[];
};

/** One entry from `GET https://www.sec.gov/files/company_tickers.json`. */
export type TickerIndexEntry = {
  cik_str: number;
  ticker: string;
  title: string;
};

/** `GET https://www.sec.gov/files/company_tickers.json` — keyed by an opaque numeric index. */
export type TickerIndexResponse = Record<string, TickerIndexEntry>;
