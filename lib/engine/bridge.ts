import { assertValidDilutedShares } from "./validate";

/**
 * `Net Debt = Total Debt − Cash − Eligible Cash-like Investments` — may be
 * negative (net-cash position). Extended (explicit user sign-off) from the
 * original `Total Debt − Cash` to also net out marketable securities where
 * SEC XBRL reliably provides them as a distinct, sourced field
 * (`cashLikeInvestments`) — never silently folded into `cash` itself.
 * `cashLikeInvestments` defaults to 0 (the original behavior) when a
 * company's securities can't be reliably mapped, not when they're genuinely
 * zero — callers pass `0` explicitly only after confirming that
 * distinction; see `bridgeEnterpriseValueToSharePrice` below for how the
 * `SourcedValue<number> | null` field feeds this.
 */
export function computeNetDebt(totalDebt: number, cash: number, cashLikeInvestments: number = 0): number {
  return totalDebt - cash - cashLikeInvestments;
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

/**
 * The full EV → Equity Value → Implied Share Price bridge, composed from
 * the three steps above. `cashLikeInvestments` is `null` when a company's
 * marketable securities can't be reliably mapped from SEC XBRL — treated
 * as excluded (contributes 0 to Net Debt), not silently assumed zero
 * holdings; `cashLikeInvestmentsIncluded` on the result says which
 * happened, so the UI never has to re-derive it.
 */
export function bridgeEnterpriseValueToSharePrice(
  enterpriseValue: number,
  totalDebt: number,
  cash: number,
  dilutedShares: number,
  cashLikeInvestments: number | null = null
): {
  netDebt: number;
  equityValue: number;
  impliedSharePrice: number;
  cashLikeInvestmentsIncluded: boolean;
} {
  const netDebt = computeNetDebt(totalDebt, cash, cashLikeInvestments ?? 0);
  const equityValue = computeEquityValue(enterpriseValue, netDebt);
  const impliedSharePrice = computeImpliedSharePrice(equityValue, dilutedShares);
  return { netDebt, equityValue, impliedSharePrice, cashLikeInvestmentsIncluded: cashLikeInvestments !== null };
}
