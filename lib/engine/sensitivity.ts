import { runDcf } from "./dcf";
import type { SensitivityGrid } from "./results";
import type { Assumptions, CompanyFinancials } from "./types";

/**
 * PRD FR-36 default step ranges: WACC ± 2pp in 0.5pp steps, terminal growth
 * ± 1pp in 0.5pp steps. `buildSensitivityGrid` accepts arbitrary step
 * arrays so it stays a generic, independently testable grid builder — these
 * are just the documented default axes.
 */
export function defaultWaccSteps(baseWacc: number): number[] {
  return [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2].map((pp) => baseWacc + pp / 100);
}

export function defaultGrowthSteps(baseTerminalGrowth: number): number[] {
  return [-1, -0.5, 0, 0.5, 1].map((pp) => baseTerminalGrowth + pp / 100);
}

/**
 * Builds the WACC × terminal-growth implied-share-price grid by calling
 * `runDcf` per cell (Architecture §8 — "the same DCF engine, not duplicate
 * logic"). Cells where `growth >= WACC` are never computed and set to
 * `null` directly (locked invariant, FR-37).
 */
export function buildSensitivityGrid(
  company: CompanyFinancials,
  baseAssumptions: Assumptions,
  waccSteps: number[] = defaultWaccSteps(baseAssumptions.wacc),
  growthSteps: number[] = defaultGrowthSteps(baseAssumptions.terminalGrowth)
): SensitivityGrid {
  const cells = waccSteps.map((wacc) =>
    growthSteps.map((growth) => {
      if (growth >= wacc) return null;
      const result = runDcf(company, { ...baseAssumptions, wacc, terminalGrowth: growth });
      return result.impliedSharePrice;
    })
  );

  return { waccSteps, growthSteps, cells };
}
