/**
 * Domain / model-state types the engine consumes (Architecture §7). Plain
 * TypeScript here, not Zod — schema parsing at the data/AI boundary is a
 * separate later-phase concern (Architecture §11); the engine only needs
 * the resulting shape.
 */

/** Every externally sourced number carries where it came from and when (CLAUDE.md — no exceptions). */
export type SourcedValue<T> = {
  value: T;
  source: string;
  asOf: string; // ISO date
};

export type FinancialLineItems = {
  fiscalYear: number;
  revenue: SourcedValue<number>;
  ebit: SourcedValue<number>;
  da: SourcedValue<number>;
  taxRate: SourcedValue<number>;
  netIncome: SourcedValue<number>;
  cash: SourcedValue<number>;
  totalDebt: SourcedValue<number>;
  dilutedShares: SourcedValue<number>;
  operatingCashFlow: SourcedValue<number>;
  capex: SourcedValue<number>;
  deltaNWC: SourcedValue<number>;
};

export type CompanyFinancials = {
  /** Exactly 5 fiscal years, oldest first (PRD FR-10). */
  historicals: FinancialLineItems[];
  currentPrice: SourcedValue<number> | null;
};

export type MarginTrajectory = "flat" | "ramp" | "fade";

export type WaccComponents = {
  riskFreeRate: SourcedValue<number>;
  beta: SourcedValue<number>;
  equityRiskPremium: SourcedValue<number>;
  preTaxCostOfDebt: SourcedValue<number>;
  marketValueDebt: number;
  marketValueEquity: number;
};

export type AdvancedAssumptions = {
  /** Forecast-year D&A as % of that year's revenue. Defaults to the base-year historical ratio. */
  daPctRevenue?: number;
  /** Forecast-year CapEx as % of that year's revenue. Defaults to the base-year historical ratio. */
  capexPctRevenue?: number;
  /**
   * NWC as % of revenue, modeled as a *level* — ΔNWC each forecast year is
   * the change in that level between periods (locked Phase 2 decision, see
   * forecast.ts), not a flat ΔNWC-per-year percentage. Defaults to the
   * historical average of deltaNWC/revenue across the historical window.
   */
  nwcPctRevenue?: number;
  /** Not yet implemented beyond "flat" in Phase 2 — see forecast.ts. */
  marginTrajectory?: MarginTrajectory;
  waccComponents?: WaccComponents;
  /** EV = Terminal Year EBITDA × exitMultiple. Omitted → no exit-multiple cross-check computed. */
  exitMultiple?: number;
  /** true = mid-year discounting convention; false/omitted = end-of-year (default). */
  midYearConvention?: boolean;
};

export type Assumptions = {
  revenueGrowth: number;
  ebitdaMargin: number;
  taxRate: number;
  wacc: number;
  terminalGrowth: number;
  advanced?: AdvancedAssumptions;
};
