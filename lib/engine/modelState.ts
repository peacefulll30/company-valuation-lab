import { computeComps } from "./comps";
import { runDcf } from "./dcf";
import { deriveHistoricalMetrics } from "./historicals";
import type { CompsCompanyInput, ValuationModelState } from "./results";
import { runScenarios, type ScenarioDeltas, DEFAULT_BEAR_DELTAS, DEFAULT_BULL_DELTAS } from "./scenarios";
import { buildSensitivityGrid } from "./sensitivity";
import type { Assumptions, CompanyFinancials } from "./types";

/**
 * Composes every engine module into the one `ValuationModelState` object
 * the UI and the AI Analyst both read from (Architecture §7) — the
 * intended single entry point for later phases, so no caller re-wires
 * dcf/scenarios/sensitivity/comps/historicals together a second way.
 */
export function buildValuationModelState(
  company: CompanyFinancials,
  assumptions: Assumptions,
  options?: {
    compsSubject?: CompsCompanyInput;
    compsPeers?: CompsCompanyInput[];
    bearDeltas?: ScenarioDeltas;
    bullDeltas?: ScenarioDeltas;
    waccSteps?: number[];
    growthSteps?: number[];
  }
): ValuationModelState {
  const dcf = runDcf(company, assumptions);
  const scenarios = runScenarios(
    company,
    assumptions,
    options?.bearDeltas ?? DEFAULT_BEAR_DELTAS,
    options?.bullDeltas ?? DEFAULT_BULL_DELTAS
  );
  const sensitivity = buildSensitivityGrid(
    company,
    assumptions,
    options?.waccSteps,
    options?.growthSteps
  );
  const comps =
    options?.compsSubject !== undefined
      ? computeComps(options.compsSubject, options.compsPeers ?? [])
      : null;

  return {
    company,
    assumptions,
    historicalMetrics: deriveHistoricalMetrics(company.historicals),
    dcf,
    scenarios,
    sensitivity,
    comps,
  };
}
