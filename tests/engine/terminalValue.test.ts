import { describe, expect, it } from "vitest";
import { InvalidAssumptionError } from "@/lib/engine/errors";
import {
  computeExitMultipleTerminalValue,
  computePerpetuityTerminalValue,
  computeTerminalValue,
} from "@/lib/engine/terminalValue";

describe("Terminal value — perpetuity growth (primary) and exit multiple (cross-check)", () => {
  it("computePerpetuityTerminalValue: TV = UFCF_(n+1) / (WACC - g)", () => {
    // UFCF_(n+1) = 80 * 1.02 = 81.6; TV = 81.6 / (0.10 - 0.02) = 1020
    expect(computePerpetuityTerminalValue(80, 0.1, 0.02)).toBeCloseTo(1020, 8);
  });

  it("computeExitMultipleTerminalValue: TV = Terminal Year EBITDA × Exit Multiple", () => {
    expect(computeExitMultipleTerminalValue(100, 13)).toBeCloseTo(1300, 10);
  });

  it.each([
    [0.05, 0.05],
    [0.05, 0.08],
    [0, 0],
  ])("computePerpetuityTerminalValue hard-rejects WACC <= g (wacc=%s, g=%s)", (wacc, g) => {
    expect(() => computePerpetuityTerminalValue(80, wacc, g)).toThrow(InvalidAssumptionError);
  });

  it("computeTerminalValue omits the exit-multiple method when no multiple is supplied", () => {
    const result = computeTerminalValue(80, 100, 0.1, 0.02);
    expect(result.perpetuity).toBeCloseTo(1020, 8);
    expect(result.exitMultiple).toBeNull();
    expect(result.divergenceFlag).toBe(false);
  });

  it("flags material divergence (>20%) between the two terminal value methods", () => {
    // perpetuity = 1020, exit = 100*13 = 1300; |1020-1300|/1300 = 0.2154 > 0.20
    const result = computeTerminalValue(80, 100, 0.1, 0.02, 13);
    expect(result.perpetuity).toBeCloseTo(1020, 8);
    expect(result.exitMultiple).toBeCloseTo(1300, 8);
    expect(result.divergenceFlag).toBe(true);
  });

  it("does not flag divergence when the two methods are close (<=20%)", () => {
    // perpetuity = 1020, exit = 100*11 = 1100; |1020-1100|/1100 = 0.0727 <= 0.20
    const result = computeTerminalValue(80, 100, 0.1, 0.02, 11);
    expect(result.divergenceFlag).toBe(false);
  });

  it("computeTerminalValue hard-rejects WACC <= g even when an exit multiple is supplied", () => {
    expect(() => computeTerminalValue(80, 100, 0.05, 0.05, 13)).toThrow(InvalidAssumptionError);
  });
});
