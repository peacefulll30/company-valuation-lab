import { describe, expect, it } from "vitest";
import { buildDefaultAssumptions } from "@/lib/featured/defaultAssumptions";
import { computeAfterTaxCostOfDebt, computeCostOfEquity, computeWacc } from "@/lib/engine";
import { marketAssumptions } from "@/lib/market-assumptions";
import type { CompanyFinancials, SourcedValue } from "@/lib/engine/types";
import type { MarketQuote } from "@/lib/market/types";

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
      cashLikeInvestments: null,
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
      cashLikeInvestments: null,
    },
    {
      fiscalYear: 2023,
      revenue: sourced(1210),
      ebit: sourced(242),
      da: sourced(60.5),
      // Deliberately a one-off spike (e.g. a discrete tax event) so the
      // fixture actually exercises "normalized average" differing from
      // "latest single year" — the whole point of the tax-rate fix.
      taxRate: sourced(0.3),
      netIncome: sourced(180),
      cash: sourced(120),
      totalDebt: sourced(50),
      dilutedShares: sourced(100),
      operatingCashFlow: sourced(260),
      capex: sourced(70),
      deltaNWC: sourced(7),
      cashLikeInvestments: null,
    },
  ],
};

describe("buildDefaultAssumptions — no live price (cost-of-equity proxy)", () => {
  const { assumptions, waccExplanation, taxRateExplanation } = buildDefaultAssumptions(financials);

  it("derives revenueGrowth as the average of the company's own historical growth rates", () => {
    // 1100/1000 - 1 = 0.10; 1210/1100 - 1 = 0.10 -> average 0.10
    expect(assumptions.revenueGrowth).toBeCloseTo(0.1, 8);
  });

  it("derives ebitdaMargin from the most recent historical year", () => {
    // (242 + 60.5) / 1210 = 0.25
    expect(assumptions.ebitdaMargin).toBeCloseTo(0.25, 8);
  });

  it("normalizes taxRate to the median of the last N valid years, not a mean and not the latest single year", () => {
    // median of [0.20, 0.22, 0.30] = 0.22 — distinct from both the mean (0.24) and the latest year (0.30).
    // The whole point of median over mean: the one-off 0.30 spike doesn't drag the default up.
    expect(assumptions.taxRate).toBeCloseTo(0.22, 8);
    expect(taxRateExplanation.normalized).toBeCloseTo(0.22, 8);
    expect(taxRateExplanation.method).toBe("median");
    expect(taxRateExplanation.latestEffective.value).toBeCloseTo(0.3, 8);
    expect(taxRateExplanation.yearsUsed).toBe(3);
  });

  it("uses terminalGrowth from the shared market-assumptions default", () => {
    expect(assumptions.terminalGrowth).toBe(marketAssumptions.defaultTerminalGrowth.value);
  });

  it("without a live price, falls back to CAPM cost of equity as the WACC proxy — never presented as weighted", () => {
    const expected = computeCostOfEquity(
      marketAssumptions.riskFreeRate.value,
      marketAssumptions.defaultBeta.value,
      marketAssumptions.equityRiskPremium.value
    );
    expect(assumptions.wacc).toBeCloseTo(expected, 10);
    expect(waccExplanation.method).toBe("cost-of-equity-proxy");
    expect(waccExplanation.costOfEquity).toBeCloseTo(expected, 10);
    expect(waccExplanation.marketValueEquity).toBeUndefined();
    expect(waccExplanation.betaBasis).toBe("market-average-placeholder");
  });

  it("exposes the real sourced components behind the WACC proxy for the UI's 'why this number' detail", () => {
    expect(waccExplanation.riskFreeRate.source).toBe(marketAssumptions.riskFreeRate.source);
    expect(waccExplanation.beta.value).toBe(marketAssumptions.defaultBeta.value);
  });
});

describe("buildDefaultAssumptions — with a live price (weighted WACC)", () => {
  const currentPrice: MarketQuote = {
    price: 20,
    currency: "USD",
    asOf: "2026-01-01T00:00:00.000Z",
    providerTimestamp: null,
    source: "Twelve Data",
    isRealTime: false,
  };
  const { assumptions, waccExplanation } = buildDefaultAssumptions(financials, currentPrice);

  it("weights WACC by market value of equity (price × diluted shares) and book value of debt", () => {
    const marketValueEquity = 20 * 100; // price × dilutedShares(2023) = 2000
    const marketValueDebt = 50; // book totalDebt(2023)
    const normalizedTaxRate = 0.22; // median of [0.20, 0.22, 0.30]
    const preTaxCostOfDebt = marketAssumptions.riskFreeRate.value + marketAssumptions.costOfDebtSpread.value;

    const expectedWacc = computeWacc(
      {
        riskFreeRate: marketAssumptions.riskFreeRate,
        beta: marketAssumptions.defaultBeta,
        equityRiskPremium: marketAssumptions.equityRiskPremium,
        preTaxCostOfDebt: { value: preTaxCostOfDebt, source: "test", asOf: "test" },
        marketValueDebt,
        marketValueEquity,
      },
      normalizedTaxRate
    );

    expect(waccExplanation.method).toBe("weighted");
    expect(assumptions.wacc).toBeCloseTo(expectedWacc, 10);
    expect(waccExplanation.marketValueEquity).toBeCloseTo(marketValueEquity, 8);
    expect(waccExplanation.marketValueDebt).toBeCloseTo(marketValueDebt, 8);
    expect(waccExplanation.weightEquity).toBeCloseTo(marketValueEquity / (marketValueEquity + marketValueDebt), 8);
    expect(waccExplanation.weightDebt).toBeCloseTo(marketValueDebt / (marketValueEquity + marketValueDebt), 8);
    expect(waccExplanation.afterTaxCostOfDebt).toBeCloseTo(
      computeAfterTaxCostOfDebt(preTaxCostOfDebt, normalizedTaxRate),
      10
    );
    // Precision disclosure — never implied more precise than the inputs support.
    expect(waccExplanation.betaBasis).toBe("market-average-placeholder");
    expect(waccExplanation.debtValueBasis).toBe("book-value-proxy");
    expect(waccExplanation.costOfDebtBasis).toBe("spread-based-proxy");
  });

  it("the weighted WACC differs from the plain cost-of-equity proxy once debt is weighted in", () => {
    const costOfEquity = computeCostOfEquity(
      marketAssumptions.riskFreeRate.value,
      marketAssumptions.defaultBeta.value,
      marketAssumptions.equityRiskPremium.value
    );
    expect(assumptions.wacc).not.toBeCloseTo(costOfEquity, 6);
  });
});
