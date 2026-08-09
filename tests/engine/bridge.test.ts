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
});
