import { assertValidDilutedShares } from "./validate";

/** Locked invariant: `Net Debt = Total Debt − Cash` — may be negative (net-cash position). */
export function computeNetDebt(totalDebt: number, cash: number): number {
  return totalDebt - cash;
}

/**
 * Locked invariant: `Equity Value = Enterprise Value − Net Debt`. A
 * net-cash company (Net Debt < 0) correctly produces Equity Value >
 * Enterprise Value — not an error, never clamped (PRD §13).
 */
export function computeEquityValue(enterpriseValue: number, netDebt: number): number {
  return enterpriseValue - netDebt;
}

/**
 * Locked invariant: `Implied Share Price = Equity Value ÷ Diluted Shares
 * Outstanding`. Guards against zero/negative/non-finite shares before
 * dividing (PRD §13 — "validated before use in division").
 */
export function computeImpliedSharePrice(equityValue: number, dilutedShares: number): number {
  assertValidDilutedShares(dilutedShares);
  return equityValue / dilutedShares;
}

/** The full EV → Equity Value → Implied Share Price bridge, composed from the three steps above. */
export function bridgeEnterpriseValueToSharePrice(
  enterpriseValue: number,
  totalDebt: number,
  cash: number,
  dilutedShares: number
): { netDebt: number; equityValue: number; impliedSharePrice: number } {
  const netDebt = computeNetDebt(totalDebt, cash);
  const equityValue = computeEquityValue(enterpriseValue, netDebt);
  const impliedSharePrice = computeImpliedSharePrice(equityValue, dilutedShares);
  return { netDebt, equityValue, impliedSharePrice };
}
