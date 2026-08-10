import { describe, expect, it } from "vitest";
import {
  bridgeEnterpriseValueToSharePrice,
  computeEquityValue,
  computeImpliedSharePrice,
  computeNetDebt,
} from "@/lib/engine/bridge";
import { InvalidSharesError } from "@/lib/engine/errors";

describe("EV → Equity Value → Implied Share Price bridge", () => {
  it("computeNetDebt: Net Debt = Total Debt − Cash", () => {
    expect(computeNetDebt(500, 200)).toBeCloseTo(300, 10);
  });

  it("computeNetDebt is negative for a net-cash company", () => {
    expect(computeNetDebt(200, 500)).toBeCloseTo(-300, 10);
  });

  it("computeNetDebt: Net Debt = Total Debt − Cash − Eligible Cash-like Investments when supplied", () => {
    expect(computeNetDebt(500, 200, 150)).toBeCloseTo(150, 10);
  });

  it("computeNetDebt defaults cash-like investments to 0 (original behavior) when omitted", () => {
    expect(computeNetDebt(500, 200)).toBeCloseTo(computeNetDebt(500, 200, 0), 10);
  });

  it("computeEquityValue: Equity Value = EV − Net Debt", () => {
    expect(computeEquityValue(2000, 300)).toBeCloseTo(1700, 10);
  });

  it("computeEquityValue: net cash makes Equity Value > Enterprise Value (not an error)", () => {
    const equityValue = computeEquityValue(2000, -300);
    expect(equityValue).toBeCloseTo(2300, 10);
    expect(equityValue).toBeGreaterThan(2000);
  });

  it("computeImpliedSharePrice: Implied Share Price = Equity Value ÷ Diluted Shares", () => {
    expect(computeImpliedSharePrice(1700, 100)).toBeCloseTo(17, 10);
  });

  it.each([0, -50, NaN, Infinity, -Infinity])(
    "computeImpliedSharePrice rejects invalid diluted shares (%s)",
    (shares) => {
      expect(() => computeImpliedSharePrice(1700, shares)).toThrow(InvalidSharesError);
    }
  );

  it("bridgeEnterpriseValueToSharePrice composes all three steps for a normal case", () => {
    const result = bridgeEnterpriseValueToSharePrice(2000, 500, 200, 100);
    expect(result.netDebt).toBeCloseTo(300, 10);
    expect(result.equityValue).toBeCloseTo(1700, 10);
    expect(result.impliedSharePrice).toBeCloseTo(17, 10);
  });

  it("bridgeEnterpriseValueToSharePrice handles a net-cash position correctly", () => {
    const result = bridgeEnterpriseValueToSharePrice(2000, 100, 500, 100);
    expect(result.netDebt).toBeCloseTo(-400, 10);
    expect(result.equityValue).toBeCloseTo(2400, 10);
    expect(result.impliedSharePrice).toBeCloseTo(24, 10);
  });

  it("bridgeEnterpriseValueToSharePrice rejects zero diluted shares", () => {
    expect(() => bridgeEnterpriseValueToSharePrice(2000, 500, 200, 0)).toThrow(InvalidSharesError);
  });

  it("bridgeEnterpriseValueToSharePrice nets eligible cash-like investments into Net Debt when supplied", () => {
    // EV=2000, debt=500, cash=200, cash-like=150 -> netDebt = 500-200-150 = 150; equity = 1850; price = 18.5
    const result = bridgeEnterpriseValueToSharePrice(2000, 500, 200, 100, 150);
    expect(result.netDebt).toBeCloseTo(150, 10);
    expect(result.equityValue).toBeCloseTo(1850, 10);
    expect(result.impliedSharePrice).toBeCloseTo(18.5, 10);
    expect(result.cashLikeInvestmentsIncluded).toBe(true);
  });

  it("bridgeEnterpriseValueToSharePrice excludes (not zeroes) cash-like investments when null", () => {
    const withNull = bridgeEnterpriseValueToSharePrice(2000, 500, 200, 100, null);
    const omitted = bridgeEnterpriseValueToSharePrice(2000, 500, 200, 100);
    expect(withNull.netDebt).toBeCloseTo(omitted.netDebt, 10);
    expect(withNull.cashLikeInvestmentsIncluded).toBe(false);
    expect(omitted.cashLikeInvestmentsIncluded).toBe(false);
  });
});
