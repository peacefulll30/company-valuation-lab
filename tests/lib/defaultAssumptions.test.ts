import { describe, expect, it } from "vitest";
import { buildDefaultAssumptions } from "@/lib/featured/defaultAssumptions";
import { computeCostOfEquity } from "@/lib/engine";
import { marketAssumptions } from "@/lib/market-assumptions";
import type { CompanyFinancials, SourcedValue } from "@/lib/engine/types";

function sourced<T>(value: T): SourcedValue<T> {
  return { value, source: "test", asOf: "2024-01-01" };
}

const financials: CompanyFinancials = {
  currentPrice: null,
  historicals: [
    {
      fiscalYear: 2021,
      revenue: sourced(1000),
      ebit: sourced(200),
      da: sourced(50),
      taxRate: sourced(0.2),
      netIncome: sourced(150),
      cash: sourced(100),
      totalDebt: sourced(50),
      dilutedShares: sourced(100),
      operatingCashFlow: sourced(220),
      capex: sourced(60),
      deltaNWC: sourced(5),
    },
    {
      fiscalYear: 2022,
      revenue: sourced(1100),
      ebit: sourced(220),
      da: sourced(55),
      taxRate: sourced(0.22),
      netIncome: sourced(165),
      cash: sourced(110),
      totalDebt: sourced(50),
      dilutedShares: sourced(100),
      operatingCashFlow: sourced(240),
      capex: sourced(65),
      deltaNWC: sourced(6),
    },
    {
      fiscalYear: 2023,
      revenue: sourced(1210),
      ebit: sourced(242),
      da: sourced(60.5),
      taxRate: sourced(0.21),
      netIncome: sourced(180),
      cash: sourced(120),
      totalDebt: sourced(50),
      dilutedShares: sourced(100),
      operatingCashFlow: sourced(260),
      capex: sourced(70),
      deltaNWC: sourced(7),
    },
  ],
};

describe("buildDefaultAssumptions", () => {
  const { assumptions, waccExplanation } = buildDefaultAssumptions(financials);

  it("derives revenueGrowth as the average of the company's own historical growth rates", () => {
    // 1100/1000 - 1 = 0.10; 1210/1100 - 1 = 0.10 -> average 0.10
    expect(assumptions.revenueGrowth).toBeCloseTo(0.1, 8);
  });

  it("derives ebitdaMargin from the most recent historical year", () => {
    // (242 + 60.5) / 1210 = 0.25
    expect(assumptions.ebitdaMargin).toBeCloseTo(0.25, 8);
  });

  it("derives taxRate from the most recent historical year", () => {
    expect(assumptions.taxRate).toBeCloseTo(0.21, 8);
  });

  it("uses terminalGrowth from the shared market-assumptions default", () => {
    expect(assumptions.terminalGrowth).toBe(marketAssumptions.defaultTerminalGrowth.value);
  });

  it("computes wacc as the CAPM cost of equity via the engine (never reimplemented inline)", () => {
    const expected = computeCostOfEquity(
      marketAssumptions.riskFreeRate.value,
      marketAssumptions.defaultBeta.value,
      marketAssumptions.equityRiskPremium.value
    );
    expect(assumptions.wacc).toBeCloseTo(expected, 10);
    expect(waccExplanation.costOfEquity).toBeCloseTo(expected, 10);
  });

  it("exposes the real sourced components behind the WACC proxy for the UI's 'why this number' detail", () => {
    expect(waccExplanation.riskFreeRate.source).toBe(marketAssumptions.riskFreeRate.source);
    expect(waccExplanation.beta.value).toBe(marketAssumptions.defaultBeta.value);
  });
});
