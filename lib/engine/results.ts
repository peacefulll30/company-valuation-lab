import type { Assumptions, CompanyFinancials } from "./types";

/** Output shapes the engine produces (Architecture §7/§8) — plain numbers, never SourcedValue. */

export type HistoricalMetrics = {
  fiscalYear: number;
  ebitda: number; // derived: EBIT + D&A
  revenueGrowth: number | null; // null for the first historical year (no prior year)
  ebitdaMargin: number | null; // null when revenue is 0
  ebitMargin: number | null;
  netMargin: number | null;
  freeCashFlow: number; // operatingCashFlow - capex (levered FCF; distinct from engine UFCF)
  fcfMargin: number | null;
  fcfConversion: number | null; // freeCashFlow / ebitda; null when ebitda is 0
  netDebtToEbitda: number | null; // (totalDebt - cash) / ebitda; null when ebitda is 0
};

/** Pure forecast output (forecast.ts) — revenue/margin build only, no tax or discounting applied yet. */
export type ForecastLineItems = {
  year: number; // 1..5, forecast-relative
  revenue: number;
  ebitda: number;
  ebit: number;
  da: number;
  capex: number;
  deltaNWC: number;
};

/** A forecast year enriched with NOPAT/UFCF (dcf.ts composes forecast.ts + nopat.ts + ufcf.ts). */
export type ForecastYear = ForecastLineItems & {
  nopat: number;
  ufcf: number;
};

export type TerminalValueResult = {
  perpetuity: number;
  exitMultiple: number | null;
  /** true when both methods are present and differ by more than the divergence threshold. */
  divergenceFlag: boolean;
};

export type DCFResult = {
  forecastYears: ForecastYear[];
  terminalValue: TerminalValueResult;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  impliedSharePrice: number;
  /** True when `cashLikeInvestments` (marketable securities) were reliably mapped and netted into `netDebt`; false means excluded, not assumed zero. */
  cashLikeInvestmentsIncluded: boolean;
};

export type ScenarioResult = {
  bear: DCFResult;
  base: DCFResult;
  bull: DCFResult;
};

export type SensitivityGrid = {
  waccSteps: number[];
  growthSteps: number[];
  /** cells[i][j] corresponds to waccSteps[i] x growthSteps[j]; null where growth >= WACC (blocked). */
  cells: (number | null)[][];
};

export type CompsCompanyInput = {
  ticker: string;
  price: number;
  dilutedShares: number;
  totalDebt: number;
  cash: number;
  revenue: number;
  /** Derived EBITDA (EBIT + D&A) — never a raw reported "EBITDA" tag (CLAUDE.md invariant #3). */
  ebitda: number;
  netIncome: number;
};

export type CompsCompanyMultiples = {
  ticker: string;
  enterpriseValue: number;
  evRevenue: number | null;
  evEbitda: number | null;
  /** null when netIncome <= 0 — a P/E on negative/zero earnings is not meaningful. */
  peRatio: number | null;
};

export type CompsResult = {
  subject: CompsCompanyMultiples;
  peers: CompsCompanyMultiples[];
  /** Implied per-share range from peer EV/EBITDA multiples applied to the subject's own EBITDA. */
  impliedRange: { low: number; high: number } | null;
};

/**
 * The single object every UI screen reads from and the AI Analyst is
 * grounded in (Architecture §7) — one shape for "the current analysis,"
 * not one per screen. `comps` is optional here since a peer set may not
 * always be supplied to `buildValuationModelState`.
 */
export type ValuationModelState = {
  company: CompanyFinancials;
  assumptions: Assumptions;
  historicalMetrics: HistoricalMetrics[];
  dcf: DCFResult;
  scenarios: ScenarioResult;
  sensitivity: SensitivityGrid;
  comps: CompsResult | null;
};
