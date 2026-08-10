import type {
  Assumptions,
  CompanyFinancials,
  FinancialLineItems,
  SourcedValue,
} from "@/lib/engine/types";

export function sourced<T>(value: T): SourcedValue<T> {
  return { value, source: "test-fixture", asOf: "2024-01-01" };
}

/** Two historical years with realistic, hand-traceable numbers. */
export const sampleHistoricals: FinancialLineItems[] = [
  {
    fiscalYear: 2022,
    revenue: sourced(1000),
    ebit: sourced(200),
    da: sourced(50),
    taxRate: sourced(0.25),
    netIncome: sourced(120),
    cash: sourced(300),
    totalDebt: sourced(100),
    dilutedShares: sourced(100),
    operatingCashFlow: sourced(220),
    capex: sourced(60),
    deltaNWC: sourced(10),
    cashLikeInvestments: null,
  },
  {
    fiscalYear: 2023,
    revenue: sourced(1100),
    ebit: sourced(220),
    da: sourced(55),
    taxRate: sourced(0.25),
    netIncome: sourced(135),
    cash: sourced(350),
    totalDebt: sourced(100),
    dilutedShares: sourced(100),
    operatingCashFlow: sourced(240),
    capex: sourced(65),
    deltaNWC: sourced(12),
    cashLikeInvestments: null,
  },
];

export const sampleCompany: CompanyFinancials = {
  historicals: sampleHistoricals,
  currentPrice: sourced(25),
};

/** Explicit advanced overrides — daPct/capexPct/nwcPct chosen for clean, hand-verifiable arithmetic. */
export const sampleAssumptions: Assumptions = {
  revenueGrowth: 0.1,
  ebitdaMargin: 0.25,
  taxRate: 0.25,
  wacc: 0.1,
  terminalGrowth: 0.02,
  advanced: {
    daPctRevenue: 0.05,
    capexPctRevenue: 0.06,
    nwcPctRevenue: 0.05,
  },
};

/**
 * A single-year "flat" fixture where every forecast year is identical
 * (zero growth, zero ΔNWC) — deliberately built so the entire 5-year DCF
 * chain reduces to a constant-annuity-plus-growing-perpetuity calculation
 * that can be hand-verified exactly (see dcf.test.ts).
 */
export const flatHistoricals: FinancialLineItems[] = [
  {
    fiscalYear: 2023,
    revenue: sourced(1000),
    ebit: sourced(250),
    da: sourced(50),
    taxRate: sourced(0.2),
    netIncome: sourced(150),
    cash: sourced(50),
    totalDebt: sourced(200),
    dilutedShares: sourced(100),
    operatingCashFlow: sourced(280),
    capex: sourced(50),
    deltaNWC: sourced(0),
    cashLikeInvestments: null,
  },
];

export const flatCompany: CompanyFinancials = {
  historicals: flatHistoricals,
  currentPrice: null,
};

/**
 * No `advanced` overrides — daPctRevenue/capexPctRevenue/nwcPctRevenue all
 * fall back to the base-year historical ratios (50/1000, 50/1000, 0/1000),
 * which is what makes the flat scenario flat.
 */
export const flatAssumptions: Assumptions = {
  revenueGrowth: 0,
  ebitdaMargin: 0.3,
  taxRate: 0.2,
  wacc: 0.1,
  terminalGrowth: 0.02,
};
