import { describe, expect, it } from "vitest";
import { InvalidAssumptionError } from "@/lib/engine/errors";
import { computeAfterTaxCostOfDebt, computeCostOfEquity, computeWacc } from "@/lib/engine/wacc";
import { sourced } from "./fixtures";

describe("WACC — CAPM cost of equity, after-tax cost of debt, weighted WACC", () => {
  it("computeCostOfEquity: CAPM", () => {
    // 0.04 + 1.2 * 0.05 = 0.10
    expect(computeCostOfEquity(0.04, 1.2, 0.05)).toBeCloseTo(0.1, 10);
  });

  it("computeAfterTaxCostOfDebt", () => {
    // 0.06 * (1 - 0.25) = 0.045
    expect(computeAfterTaxCostOfDebt(0.06, 0.25)).toBeCloseTo(0.045, 10);
  });

  it("computeWacc weights cost of equity and after-tax cost of debt by market value", () => {
    // costOfEquity = 0.04 + 1.2*0.05 = 0.10, afterTaxCostOfDebt = 0.06*0.75=0.045
    // weightEquity = 800/1000=0.8, weightDebt=0.2
    // WACC = 0.8*0.10 + 0.2*0.045 = 0.08 + 0.009 = 0.089
    const wacc = computeWacc(
      {
        riskFreeRate: sourced(0.04),
        beta: sourced(1.2),
        equityRiskPremium: sourced(0.05),
        preTaxCostOfDebt: sourced(0.06),
        marketValueDebt: 200,
        marketValueEquity: 800,
      },
      0.25
    );
    expect(wacc).toBeCloseTo(0.089, 10);
  });

  it("rejects zero total capital (debt + equity)", () => {
    expect(() =>
      computeWacc(
        {
          riskFreeRate: sourced(0.04),
          beta: sourced(1.2),
          equityRiskPremium: sourced(0.05),
          preTaxCostOfDebt: sourced(0.06),
          marketValueDebt: 0,
          marketValueEquity: 0,
        },
        0.25
      )
    ).toThrow(InvalidAssumptionError);
  });

  it("an all-equity capital structure reduces WACC to cost of equity alone", () => {
    const wacc = computeWacc(
      {
        riskFreeRate: sourced(0.04),
        beta: sourced(1.2),
        equityRiskPremium: sourced(0.05),
        preTaxCostOfDebt: sourced(0.06),
        marketValueDebt: 0,
        marketValueEquity: 1000,
      },
      0.25
    );
    expect(wacc).toBeCloseTo(0.1, 10);
  });
});
