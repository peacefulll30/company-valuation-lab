import { describe, expect, it } from "vitest";
import { buildValuationModelState } from "@/lib/engine/modelState";
import { flatAssumptions, flatCompany } from "./fixtures";

describe("buildValuationModelState", () => {
  it("composes historicals, DCF, scenarios, and sensitivity into one state object", () => {
    const state = buildValuationModelState(flatCompany, flatAssumptions);
    expect(state.company).toBe(flatCompany);
    expect(state.assumptions).toBe(flatAssumptions);
    expect(state.historicalMetrics).toHaveLength(1);
    expect(state.dcf.impliedSharePrice).toBeCloseTo(21.915067276825347, 6);
    expect(state.scenarios.base.impliedSharePrice).toBeCloseTo(state.dcf.impliedSharePrice, 10);
    expect(state.sensitivity.cells.length).toBeGreaterThan(0);
    expect(state.comps).toBeNull(); // no comps subject supplied
  });
});
