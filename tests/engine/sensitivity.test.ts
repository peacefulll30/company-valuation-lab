import { describe, expect, it } from "vitest";
import { runDcf } from "@/lib/engine/dcf";
import {
  buildSensitivityGrid,
  defaultGrowthSteps,
  defaultWaccSteps,
} from "@/lib/engine/sensitivity";
import { flatAssumptions, flatCompany } from "./fixtures";

describe("buildSensitivityGrid", () => {
  it("default step generators center on the base WACC/terminal growth", () => {
    const waccSteps = defaultWaccSteps(0.1);
    const growthSteps = defaultGrowthSteps(0.02);
    expect(waccSteps).toHaveLength(9); // +-2pp in 0.5pp steps
    expect(waccSteps[4]).toBeCloseTo(0.1, 10); // the center step
    expect(growthSteps).toHaveLength(5); // +-1pp in 0.5pp steps
    expect(growthSteps[2]).toBeCloseTo(0.02, 10);
  });

  it("blocks (null) every cell where growth >= WACC, never computing it", () => {
    const grid = buildSensitivityGrid(flatCompany, flatAssumptions, [0.08, 0.1, 0.12], [0.02, 0.09]);
    // wacc=0.08, growth=0.09 -> 0.09 >= 0.08 -> blocked
    expect(grid.cells[0][1]).toBeNull();
    // wacc=0.10, growth=0.09 -> 0.09 < 0.10 -> not blocked
    expect(grid.cells[1][1]).not.toBeNull();
    // wacc=0.12, growth=0.09 -> 0.09 < 0.12 -> not blocked
    expect(grid.cells[2][1]).not.toBeNull();
  });

  it("every non-blocked cell exactly matches runDcf's own output — same engine, not duplicated logic", () => {
    const waccSteps = [0.08, 0.1, 0.12];
    const growthSteps = [0.02, 0.09];
    const grid = buildSensitivityGrid(flatCompany, flatAssumptions, waccSteps, growthSteps);

    for (let i = 0; i < waccSteps.length; i++) {
      for (let j = 0; j < growthSteps.length; j++) {
        const wacc = waccSteps[i];
        const growth = growthSteps[j];
        if (growth >= wacc) {
          expect(grid.cells[i][j]).toBeNull();
          continue;
        }
        const expected = runDcf(flatCompany, { ...flatAssumptions, wacc, terminalGrowth: growth })
          .impliedSharePrice;
        expect(grid.cells[i][j]).toBeCloseTo(expected, 10);
      }
    }
  });

  it("returns the exact step arrays used to build the grid", () => {
    const waccSteps = [0.09, 0.1, 0.11];
    const growthSteps = [0.01, 0.02];
    const grid = buildSensitivityGrid(flatCompany, flatAssumptions, waccSteps, growthSteps);
    expect(grid.waccSteps).toEqual(waccSteps);
    expect(grid.growthSteps).toEqual(growthSteps);
    expect(grid.cells).toHaveLength(waccSteps.length);
    expect(grid.cells[0]).toHaveLength(growthSteps.length);
  });
});
