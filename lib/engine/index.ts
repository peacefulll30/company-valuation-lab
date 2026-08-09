/**
 * The only import path the rest of the app is allowed to use (Architecture
 * §8) — individual `lib/engine/*.ts` files are internal implementation.
 */

export * from "./types";
export * from "./results";
export * from "./errors";

export { deriveHistoricalMetrics } from "./historicals";
export { generateForecast, FORECAST_YEARS } from "./forecast";
export { computeNopat } from "./nopat";
export { computeUfcf } from "./ufcf";
export {
  computeCostOfEquity,
  computeAfterTaxCostOfDebt,
  computeWacc,
} from "./wacc";
export {
  computePerpetuityTerminalValue,
  computeExitMultipleTerminalValue,
  computeTerminalValue,
  DIVERGENCE_THRESHOLD,
} from "./terminalValue";
export {
  computeNetDebt,
  computeEquityValue,
  computeImpliedSharePrice,
  bridgeEnterpriseValueToSharePrice,
} from "./bridge";
export { runDcf } from "./dcf";
export {
  runScenarios,
  applyScenarioDeltas,
  DEFAULT_BEAR_DELTAS,
  DEFAULT_BULL_DELTAS,
} from "./scenarios";
export type { ScenarioDeltas } from "./scenarios";
export { buildSensitivityGrid, defaultWaccSteps, defaultGrowthSteps } from "./sensitivity";
export { computeCompanyMultiples, computeComps } from "./comps";
export { buildValuationModelState } from "./modelState";
export {
  assertWaccExceedsGrowth,
  assertValidDilutedShares,
  requireSourcedNumber,
  requireFiniteNumber,
} from "./validate";
