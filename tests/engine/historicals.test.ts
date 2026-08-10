import { describe, expect, it } from "vitest";
import { deriveHistoricalMetrics } from "@/lib/engine/historicals";
import { MissingRequiredFieldError } from "@/lib/engine/errors";
import { sampleHistoricals, sourced } from "./fixtures";

describe("deriveHistoricalMetrics", () => {
  const metrics = deriveHistoricalMetrics(sampleHistoricals);

  it("derives EBITDA = EBIT + D&A for every year", () => {
    expect(metrics[0].ebitda).toBeCloseTo(250, 10); // 200 + 50
    expect(metrics[1].ebitda).toBeCloseTo(275, 10); // 220 + 55
  });

  it("leaves revenueGrowth null for the first historical year (no prior year)", () => {
    expect(metrics[0].revenueGrowth).toBeNull();
  });

  it("computes revenueGrowth for subsequent years", () => {
    expect(metrics[1].revenueGrowth).toBeCloseTo(0.1, 10); // 1100/1000 - 1
  });

  it("computes margin metrics for year 1", () => {
    expect(metrics[0].ebitdaMargin).toBeCloseTo(0.25, 10);
    expect(metrics[0].ebitMargin).toBeCloseTo(0.2, 10);
    expect(metrics[0].netMargin).toBeCloseTo(0.12, 10);
  });

  it("computes margin metrics for year 2", () => {
    expect(metrics[1].ebitdaMargin).toBeCloseTo(0.25, 10);
    expect(metrics[1].ebitMargin).toBeCloseTo(0.2, 10);
    expect(metrics[1].netMargin).toBeCloseTo(135 / 1100, 10);
  });

  it("computes free cash flow as Operating Cash Flow − CapEx", () => {
    expect(metrics[0].freeCashFlow).toBeCloseTo(160, 10); // 220 - 60
    expect(metrics[1].freeCashFlow).toBeCloseTo(175, 10); // 240 - 65
  });

  it("computes fcfMargin and fcfConversion", () => {
    expect(metrics[0].fcfMargin).toBeCloseTo(0.16, 10);
    expect(metrics[0].fcfConversion).toBeCloseTo(160 / 250, 10);
    expect(metrics[1].fcfMargin).toBeCloseTo(175 / 1100, 10);
    expect(metrics[1].fcfConversion).toBeCloseTo(175 / 275, 10);
  });

  it("computes netDebtToEbitda, correctly negative for a net-cash year", () => {
    // year 1: totalDebt 100, cash 300 -> netDebt -200; /ebitda 250 = -0.8
    expect(metrics[0].netDebtToEbitda).toBeCloseTo(-0.8, 10);
    // year 2: totalDebt 100, cash 350 -> netDebt -250; /ebitda 275
    expect(metrics[1].netDebtToEbitda).toBeCloseTo(-250 / 275, 10);
  });

  it("renders negative EBITDA without hiding or clamping it", () => {
    const [negativeYear] = deriveHistoricalMetrics([
      {
        fiscalYear: 2023,
        revenue: sourced(1000),
        ebit: sourced(-300),
        da: sourced(50),
        taxRate: sourced(0.25),
        netIncome: sourced(-250),
        cash: sourced(50),
        totalDebt: sourced(100),
        dilutedShares: sourced(100),
        operatingCashFlow: sourced(-100),
        capex: sourced(20),
        deltaNWC: sourced(0),
        cashLikeInvestments: null,
      },
    ]);
    expect(negativeYear.ebitda).toBeCloseTo(-250, 10); // -300 + 50, not clamped to 0
    expect(negativeYear.freeCashFlow).toBeCloseTo(-120, 10);
  });

  it("returns null margins instead of Infinity/NaN when revenue is zero", () => {
    const [zeroRevenueYear] = deriveHistoricalMetrics([
      {
        fiscalYear: 2023,
        revenue: sourced(0),
        ebit: sourced(0),
        da: sourced(0),
        taxRate: sourced(0.25),
        netIncome: sourced(0),
        cash: sourced(0),
        totalDebt: sourced(0),
        dilutedShares: sourced(100),
        operatingCashFlow: sourced(0),
        capex: sourced(0),
        deltaNWC: sourced(0),
        cashLikeInvestments: null,
      },
    ]);
    expect(zeroRevenueYear.ebitdaMargin).toBeNull();
    expect(zeroRevenueYear.ebitMargin).toBeNull();
    expect(zeroRevenueYear.netMargin).toBeNull();
    expect(zeroRevenueYear.fcfMargin).toBeNull();
    expect(zeroRevenueYear.netDebtToEbitda).toBeNull(); // ebitda is also 0 here
  });

  it("throws MissingRequiredFieldError rather than defaulting a missing field to 0", () => {
    const brokenHistoricals = [
      { ...sampleHistoricals[0], revenue: sourced(Number.NaN) },
    ];
    expect(() => deriveHistoricalMetrics(brokenHistoricals)).toThrow(MissingRequiredFieldError);
  });
});
