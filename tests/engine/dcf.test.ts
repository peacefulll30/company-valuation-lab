import { describe, expect, it } from "vitest";
import { runDcf } from "@/lib/engine/dcf";
import { InvalidAssumptionError, InvalidSharesError, MissingRequiredFieldError } from "@/lib/engine/errors";
import type { CompanyFinancials } from "@/lib/engine/types";
import { flatAssumptions, flatCompany, flatHistoricals, sourced } from "./fixtures";

/**
 * `flatCompany`/`flatAssumptions` produce a constant UFCF of exactly 200 in
 * every forecast year (zero growth, zero ΔNWC — see fixtures.ts), which
 * reduces the full 5-year DCF to a hand-verifiable constant-annuity +
 * growing-perpetuity calculation. Expected values below were independently
 * computed and cross-checked to 10+ significant figures.
 */
describe("runDcf — normal case (hand-verified reference values)", () => {
  const result = runDcf(flatCompany, flatAssumptions);

  it("computes UFCF of exactly 200 for every forecast year", () => {
    for (const year of result.forecastYears) {
      expect(year.ufcf).toBeCloseTo(200, 8);
      expect(year.nopat).toBeCloseTo(200, 8); // NOPAT = 200 here since capex - da - deltaNWC = 0
    }
  });

  it("computes perpetuity terminal value: TV = 200*1.02 / (0.10-0.02) = 2550", () => {
    expect(result.terminalValue.perpetuity).toBeCloseTo(2550, 6);
    expect(result.terminalValue.exitMultiple).toBeNull();
  });

  it("computes Enterprise Value = PV(UFCF) + PV(TV)", () => {
    expect(result.enterpriseValue).toBeCloseTo(2341.506727682535, 6);
  });

  it("computes Net Debt = Total Debt − Cash", () => {
    expect(result.netDebt).toBeCloseTo(150, 8); // 200 - 50
  });

  it("computes Equity Value = EV − Net Debt", () => {
    expect(result.equityValue).toBeCloseTo(2191.506727682535, 6);
  });

  it("computes Implied Share Price = Equity Value / Diluted Shares", () => {
    expect(result.impliedSharePrice).toBeCloseTo(21.915067276825347, 6);
  });
});

describe("runDcf — net cash case (Cash > Debt)", () => {
  const netCashCompany: CompanyFinancials = {
    historicals: [{ ...flatHistoricals[0], cash: sourced(500) }], // totalDebt stays 200
    currentPrice: null,
  };
  const result = runDcf(netCashCompany, flatAssumptions);

  it("produces a negative Net Debt", () => {
    expect(result.netDebt).toBeCloseTo(-300, 8); // 200 - 500
  });

  it("makes Equity Value > Enterprise Value — valid, not an error", () => {
    expect(result.equityValue).toBeGreaterThan(result.enterpriseValue);
    expect(result.equityValue).toBeCloseTo(2641.506727682535, 6);
  });

  it("computes the correspondingly higher implied share price", () => {
    expect(result.impliedSharePrice).toBeCloseTo(26.415067276825347, 6);
  });
});

describe("runDcf — negative UFCF case", () => {
  const result = runDcf(flatCompany, { ...flatAssumptions, ebitdaMargin: -0.1 });

  it("produces negative EBITDA/UFCF every year without clamping to zero", () => {
    for (const year of result.forecastYears) {
      expect(year.ebitda).toBeCloseTo(-100, 8);
      expect(year.ufcf).toBeCloseTo(-120, 8);
    }
  });

  it("produces a negative terminal value and enterprise value, computed not hidden", () => {
    expect(result.terminalValue.perpetuity).toBeCloseTo(-1530, 6);
    expect(result.enterpriseValue).toBeCloseTo(-1404.9040366095207, 4);
  });

  it("can produce a negative implied share price — rendered, not suppressed", () => {
    expect(result.impliedSharePrice).toBeCloseTo(-15.549040366095207, 4);
  });
});

describe("runDcf — WACC <= terminal growth is hard-rejected", () => {
  it("throws for WACC equal to terminal growth", () => {
    expect(() => runDcf(flatCompany, { ...flatAssumptions, wacc: 0.02, terminalGrowth: 0.02 })).toThrow(
      InvalidAssumptionError
    );
  });

  it("throws for WACC below terminal growth", () => {
    expect(() => runDcf(flatCompany, { ...flatAssumptions, wacc: 0.01, terminalGrowth: 0.02 })).toThrow(
      InvalidAssumptionError
    );
  });
});

describe("runDcf — zero/invalid diluted shares", () => {
  it("rejects zero diluted shares", () => {
    const company: CompanyFinancials = {
      historicals: [{ ...flatHistoricals[0], dilutedShares: sourced(0) }],
      currentPrice: null,
    };
    expect(() => runDcf(company, flatAssumptions)).toThrow(InvalidSharesError);
  });

  it("rejects negative diluted shares", () => {
    const company: CompanyFinancials = {
      historicals: [{ ...flatHistoricals[0], dilutedShares: sourced(-10) }],
      currentPrice: null,
    };
    expect(() => runDcf(company, flatAssumptions)).toThrow(InvalidSharesError);
  });
});

describe("runDcf — eligible cash-like investments (marketable securities)", () => {
  it("nets cash-like investments into Net Debt when the base year provides them, and flags it", () => {
    const company: CompanyFinancials = {
      historicals: [{ ...flatHistoricals[0], cashLikeInvestments: sourced(100) }],
      currentPrice: null,
    };
    const withCashLike = runDcf(company, flatAssumptions);
    const baseline = runDcf(flatCompany, flatAssumptions);

    // Same EV either way — only the bridge below EV changes.
    expect(withCashLike.enterpriseValue).toBeCloseTo(baseline.enterpriseValue, 6);
    // netDebt = totalDebt(200) - cash(50) - cashLikeInvestments(100) = 50, vs baseline's 150.
    expect(withCashLike.netDebt).toBeCloseTo(50, 8);
    expect(withCashLike.equityValue).toBeCloseTo(baseline.equityValue + 100, 6);
    expect(withCashLike.impliedSharePrice).toBeCloseTo(baseline.impliedSharePrice + 1, 6);
    expect(withCashLike.cashLikeInvestmentsIncluded).toBe(true);
  });

  it("excludes (never zeroes) cash-like investments when the base year doesn't provide them", () => {
    const result = runDcf(flatCompany, flatAssumptions); // flatHistoricals[0].cashLikeInvestments is null
    expect(result.cashLikeInvestmentsIncluded).toBe(false);
    expect(result.netDebt).toBeCloseTo(150, 8); // unaffected — same as the original Total Debt - Cash
  });
});

describe("runDcf — missing required data never defaults to 0", () => {
  it("throws MissingRequiredFieldError when a required historical field is not a finite number", () => {
    const company: CompanyFinancials = {
      historicals: [{ ...flatHistoricals[0], totalDebt: sourced(Number.NaN) }],
      currentPrice: null,
    };
    expect(() => runDcf(company, flatAssumptions)).toThrow(MissingRequiredFieldError);
  });
});

describe("runDcf — mid-year discounting convention", () => {
  it("mid-year convention discounts more lightly (higher exponent-adjusted PV) than end-of-year", () => {
    const endOfYear = runDcf(flatCompany, flatAssumptions);
    const midYear = runDcf(flatCompany, {
      ...flatAssumptions,
      advanced: { midYearConvention: true },
    });
    expect(midYear.enterpriseValue).toBeGreaterThan(endOfYear.enterpriseValue);
  });
});
