import type { CompanyFinancials } from "@/lib/engine/types";
import type { MarketQuote } from "@/lib/market/types";
import { buildDefaultAssumptions, type WaccExplanation } from "./defaultAssumptions";

/**
 * AUTO: WACC is derived — from a live price when one is available (a
 * weighted Estimated WACC), or the CAPM cost-of-equity proxy when it isn't.
 * MANUAL: the user typed their own WACC on Forecast — it is never
 * recomputed or silently overwritten until they explicitly reset.
 */
export type WaccMode = "auto" | "manual";

export type WaccRefreshResult = { wacc: number; waccExplanation: WaccExplanation };

/**
 * What a successful price refresh should do to WACC — factored out of the
 * React context so the AUTO/MANUAL decision is a plain, unit-testable
 * function with no DOM involved (finance-product-builder: calculation
 * logic stays separate from presentation logic).
 *
 * AUTO: recomputes via `buildDefaultAssumptions` (the same, single WACC
 * formula used everywhere — never reimplemented here) using the fresh
 * market value of equity (price × diluted shares).
 * MANUAL: returns `null` — the caller must leave the current assumptions
 * untouched. A price refresh must never overwrite a WACC the user typed
 * themselves.
 */
export function applyPriceRefreshToWacc(
  financials: CompanyFinancials,
  waccMode: WaccMode,
  quote: MarketQuote
): WaccRefreshResult | null {
  if (waccMode === "manual") return null;
  const { assumptions, waccExplanation } = buildDefaultAssumptions(financials, quote);
  return { wacc: assumptions.wacc, waccExplanation };
}

/**
 * The compact "AUTO — Estimated WACC" / "MANUAL — User assumption" label
 * (per-brief, verbatim). Mode always wins over method — a manually-set
 * value is "Manual" regardless of what it happened to start from. Under
 * AUTO, the method distinguishes the two honestly labeled sub-states: a
 * live price gives a weighted estimate, no price falls back to the CAPM
 * proxy — never blended, never implying more precision than the inputs
 * support.
 */
export function waccModeLabel(waccMode: WaccMode, method: WaccExplanation["method"]): string {
  if (waccMode === "manual") return "MANUAL — User assumption";
  return method === "weighted" ? "AUTO — Estimated WACC" : "AUTO — CAPM proxy (no live price)";
}
