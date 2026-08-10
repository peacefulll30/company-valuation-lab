import { describe, expect, it } from "vitest";
import { applyPriceRefreshToWacc, waccModeLabel } from "@/lib/featured/waccMode";
import { buildDefaultAssumptions } from "@/lib/featured/defaultAssumptions";
import { computeCostOfEquity } from "@/lib/engine";
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
      fiscalYear: 2022,
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
      fiscalYear: 2023,
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
  ],
};

const quote: MarketQuote = {
  price: 20,
  currency: "USD",
  asOf: "2026-01-01T00:00:00.000Z",
  providerTimestamp: null,
  source: "Twelve Data",
  isRealTime: false,
};

describe("applyPriceRefreshToWacc — AUTO/MANUAL WACC on a price refresh", () => {
  it("price available + AUTO mode: recomputes a weighted Estimated WACC from the fresh market value of equity", () => {
    const result = applyPriceRefreshToWacc(financials, "auto", quote);

    expect(result).not.toBeNull();
    expect(result!.waccExplanation.method).toBe("weighted");
    // Cross-checked against the same, single WACC formula used everywhere
    // else (never a second implementation here) — `applyPriceRefreshToWacc`
    // is purely a mode-aware dispatcher on top of it.
    const expected = buildDefaultAssumptions(financials, quote);
    expect(result!.wacc).toBeCloseTo(expected.assumptions.wacc, 10);
    expect(result!.waccExplanation.marketValueEquity).toBeCloseTo(quote.price * 100, 8);
  });

  it("manual WACC survives a quote refresh: MANUAL mode returns null so the caller leaves assumptions untouched", () => {
    const result = applyPriceRefreshToWacc(financials, "manual", quote);
    expect(result).toBeNull();
  });

  it("price unavailable fallback: without a live price, AUTO falls back to the CAPM cost-of-equity proxy, clearly labeled", () => {
    const { assumptions, waccExplanation } = buildDefaultAssumptions(financials, null);
    const expectedCostOfEquity = computeCostOfEquity(
      marketAssumptions.riskFreeRate.value,
      marketAssumptions.defaultBeta.value,
      marketAssumptions.equityRiskPremium.value
    );

    expect(waccExplanation.method).toBe("cost-of-equity-proxy");
    expect(assumptions.wacc).toBeCloseTo(expectedCostOfEquity, 10);
    expect(waccModeLabel("auto", waccExplanation.method)).toBe("AUTO — CAPM proxy (no live price)");
  });
});

describe("waccModeLabel", () => {
  it("labels AUTO + weighted as the Estimated WACC", () => {
    expect(waccModeLabel("auto", "weighted")).toBe("AUTO — Estimated WACC");
  });

  it("labels AUTO + no price as the CAPM proxy fallback, never implying the weighted estimate", () => {
    expect(waccModeLabel("auto", "cost-of-equity-proxy")).toBe("AUTO — CAPM proxy (no live price)");
  });

  it("labels MANUAL as a user assumption regardless of method — mode always wins over method", () => {
    expect(waccModeLabel("manual", "weighted")).toBe("MANUAL — User assumption");
    expect(waccModeLabel("manual", "cost-of-equity-proxy")).toBe("MANUAL — User assumption");
  });
});
