import { runDcf } from "./dcf";
import type { ScenarioResult } from "./results";
import type { Assumptions, CompanyFinancials } from "./types";

/** Additive deltas applied to the Base case's operating assumptions (PRD FR-32). */
export type ScenarioDeltas = {
  revenueGrowth: number;
  ebitdaMargin: number;
  terminalGrowth: number;
  /** Applied only when the Base case has an explicit capexPctRevenue override — see applyScenarioDeltas. */
  capexPctRevenue?: number;
};

/**
 * Locked generic scenario defaults: ±2pp revenue growth, ±2pp EBITDA
 * margin, ±0.5pp terminal growth. Centralized here as the single source of
 * truth — no other module restates these numbers. Callers can still pass
 * their own `ScenarioDeltas` to `runScenarios` for a company-specific
 * override; that does not change what "default" means.
 */
export const DEFAULT_BEAR_DELTAS: ScenarioDeltas = {
  revenueGrowth: -0.02,
  ebitdaMargin: -0.02,
  terminalGrowth: -0.005,
};

export const DEFAULT_BULL_DELTAS: ScenarioDeltas = {
  revenueGrowth: 0.02,
  ebitdaMargin: 0.02,
  terminalGrowth: 0.005,
};

/**
 * Applies deltas to operating assumptions only. WACC is never read from
 * `deltas` and is copied through unchanged — the mechanism behind "WACC
 * stays constant across all three scenarios in V1" (locked invariant).
 */
export function applyScenarioDeltas(base: Assumptions, deltas: ScenarioDeltas): Assumptions {
  const capexPctRevenue =
    deltas.capexPctRevenue !== undefined && base.advanced?.capexPctRevenue !== undefined
      ? base.advanced.capexPctRevenue + deltas.capexPctRevenue
      : base.advanced?.capexPctRevenue;

  return {
    ...base,
    revenueGrowth: base.revenueGrowth + deltas.revenueGrowth,
    ebitdaMargin: base.ebitdaMargin + deltas.ebitdaMargin,
    terminalGrowth: base.terminalGrowth + deltas.terminalGrowth,
    wacc: base.wacc,
    advanced: base.advanced ? { ...base.advanced, capexPctRevenue } : base.advanced,
  };
}

/**
 * Runs Bear/Base/Bull through the same `runDcf` (Architecture §8
 * `scenarios.ts` — "calls dcf.ts three times", never a re-implementation).
 * A scenario whose derived terminal growth ends up >= WACC surfaces as a
 * thrown `InvalidAssumptionError` from `runDcf`, not a silently wrong cell.
 */
export function runScenarios(
  company: CompanyFinancials,
  baseAssumptions: Assumptions,
  bearDeltas: ScenarioDeltas = DEFAULT_BEAR_DELTAS,
  bullDeltas: ScenarioDeltas = DEFAULT_BULL_DELTAS
): ScenarioResult {
  return {
    bear: runDcf(company, applyScenarioDeltas(baseAssumptions, bearDeltas)),
    base: runDcf(company, baseAssumptions),
    bull: runDcf(company, applyScenarioDeltas(baseAssumptions, bullDeltas)),
  };
}
