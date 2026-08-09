import { describe, expect, it } from "vitest";
import { runDcf } from "@/lib/engine/dcf";
import { InvalidAssumptionError } from "@/lib/engine/errors";
import {
  DEFAULT_BEAR_DELTAS,
  DEFAULT_BULL_DELTAS,
  applyScenarioDeltas,
  runScenarios,
} from "@/lib/engine/scenarios";
import { flatAssumptions, flatCompany } from "./fixtures";

describe("runScenarios", () => {
  const result = runScenarios(flatCompany, flatAssumptions);

  it("holds WACC constant across Bear/Base/Bull (locked invariant)", () => {
    // WACC isn't part of DCFResult directly, but it drives discounting — cross-check
    // via applyScenarioDeltas, which is what runScenarios uses to build each case.
    const bearAssumptions = applyScenarioDeltas(flatAssumptions, DEFAULT_BEAR_DELTAS);
    const bullAssumptions = applyScenarioDeltas(flatAssumptions, DEFAULT_BULL_DELTAS);
    expect(bearAssumptions.wacc).toBe(flatAssumptions.wacc);
    expect(bullAssumptions.wacc).toBe(flatAssumptions.wacc);
  });

  it("varies only operating assumptions (revenue growth, EBITDA margin, terminal growth)", () => {
    const bearAssumptions = applyScenarioDeltas(flatAssumptions, DEFAULT_BEAR_DELTAS);
    expect(bearAssumptions.revenueGrowth).toBeCloseTo(
      flatAssumptions.revenueGrowth + DEFAULT_BEAR_DELTAS.revenueGrowth,
      10
    );
    expect(bearAssumptions.ebitdaMargin).toBeCloseTo(
      flatAssumptions.ebitdaMargin + DEFAULT_BEAR_DELTAS.ebitdaMargin,
      10
    );
    expect(bearAssumptions.terminalGrowth).toBeCloseTo(
      flatAssumptions.terminalGrowth + DEFAULT_BEAR_DELTAS.terminalGrowth,
      10
    );
  });

  it("produces a complete DCF output for each of the three cases", () => {
    for (const dcfResult of [result.bear, result.base, result.bull]) {
      expect(dcfResult.forecastYears).toHaveLength(5);
      expect(typeof dcfResult.enterpriseValue).toBe("number");
      expect(typeof dcfResult.equityValue).toBe("number");
      expect(typeof dcfResult.impliedSharePrice).toBe("number");
    }
  });

  it("Bear produces a lower implied share price than Base, and Bull a higher one", () => {
    expect(result.bear.impliedSharePrice).toBeLessThan(result.base.impliedSharePrice);
    expect(result.bull.impliedSharePrice).toBeGreaterThan(result.base.impliedSharePrice);
  });

  it("delegates to the same runDcf used everywhere else — no duplicated DCF logic", () => {
    const bearAssumptions = applyScenarioDeltas(flatAssumptions, DEFAULT_BEAR_DELTAS);
    const directBear = runDcf(flatCompany, bearAssumptions);
    expect(result.bear.impliedSharePrice).toBeCloseTo(directBear.impliedSharePrice, 10);
    expect(result.bear.enterpriseValue).toBeCloseTo(directBear.enterpriseValue, 10);
  });

  it("throws if a scenario's deltas push terminal growth to/above WACC", () => {
    // flatAssumptions.terminalGrowth (0.02) + wacc (0.10) leaves 8pp of room;
    // a deliberately large bull growth delta breaches it.
    expect(() =>
      runScenarios(flatCompany, flatAssumptions, DEFAULT_BEAR_DELTAS, {
        ...DEFAULT_BULL_DELTAS,
        terminalGrowth: 0.09,
      })
    ).toThrow(InvalidAssumptionError);
  });
});
