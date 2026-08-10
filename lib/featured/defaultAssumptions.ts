import { computeAfterTaxCostOfDebt, computeCostOfEquity, computeWacc, deriveHistoricalMetrics } from "@/lib/engine";
import type { Assumptions, CompanyFinancials, SourcedValue, WaccComponents } from "@/lib/engine/types";
import type { MarketQuote } from "@/lib/market/types";
import { marketAssumptions } from "@/lib/market-assumptions";

export type WaccExplanation = {
  riskFreeRate: SourcedValue<number>;
  beta: SourcedValue<number>;
  equityRiskPremium: SourcedValue<number>;
  costOfEquity: number;
  /**
   * "weighted" = a capital-structure-weighted **estimate** (this file's
   * `computeWacc`, never reimplemented) — only possible once a live price
   * gives us a market value of equity, and still built from proxy inputs
   * (see the `*Basis` fields below), never precision the underlying data
   * doesn't support. "cost-of-equity-proxy" = cost of equity used directly
   * as WACC, the honest fallback when no live price is available. The UI
   * must brand these as "Estimated WACC" / "Model WACC" — never as a
   * precise or "true" figure, and never blend the two labels.
   */
  method: "weighted" | "cost-of-equity-proxy";
  /** Always "market-average-placeholder" today — no per-company beta is sourced from any provider (see `market-assumptions.json`). Kept as an explicit field, not a hardcoded UI string, so the label can never silently drift from what was actually used. */
  betaBasis: "company-specific" | "market-average-placeholder";
  preTaxCostOfDebt?: SourcedValue<number>;
  /** Only meaningful when `method === "weighted"`. Always "spread-based-proxy" today — `riskFreeRate + costOfDebtSpread`, never a sourced/quoted company bond yield. */
  costOfDebtBasis?: "sourced" | "spread-based-proxy";
  afterTaxCostOfDebt?: number;
  marketValueEquity?: number;
  /** Only meaningful when `method === "weighted"`. Always "book-value-proxy" today — no market-priced bond source exists for these companies' debt. */
  debtValueBasis?: "market-value" | "book-value-proxy";
  marketValueDebt?: number;
  weightEquity?: number;
  weightDebt?: number;
};

export type TaxRateExplanation = {
  /** Default fed into `Assumptions.taxRate` — the median of up to the last 5 valid filed years, not a single volatile year projected forever, and robust to a one-off spike the way a mean isn't. */
  normalized: number;
  /** The most recent single filed year's effective rate, for comparison — never itself the forecast default. */
  latestEffective: SourcedValue<number>;
  /** How many valid years actually fed the median (≤ 5; excludes any non-finite filed value). */
  yearsUsed: number;
  method: "median";
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Median (not mean) of up to the last 5 *valid* filed effective tax rates —
 * robust to a single one-off year (a discrete tax event, a large credit)
 * the way an arithmetic average isn't. "Valid" excludes non-finite values
 * defensively; it never excludes a real, finite, merely-unusual rate (e.g.
 * a large credit producing a negative rate, or an outlier year) — median
 * is what handles those safely, not a second layer of judgment about which
 * real filed numbers "count."
 */
function computeNormalizedTaxRate(financials: CompanyFinancials): TaxRateExplanation {
  const validRates = financials.historicals.map((h) => h.taxRate.value).filter((r) => Number.isFinite(r));
  const lastFive = validRates.slice(-5);
  const normalized = lastFive.length > 0 ? median(lastFive) : 0;
  const latestEffective = financials.historicals[financials.historicals.length - 1].taxRate;
  return { normalized, latestEffective, yearsUsed: lastFive.length, method: "median" };
}

/**
 * Builds the mandatory default Assumptions for a company from its own real
 * historicals plus the shared market-assumption defaults. Every default
 * here remains user-editable on the Forecast tab — this only decides the
 * starting point.
 *
 * `revenueGrowth`/`ebitdaMargin` are entirely company-specific and real
 * (derived from filed history via `deriveHistoricalMetrics`). `taxRate`
 * defaults to the *normalized* (median) rate, not a single volatile filed
 * year projected forever — see `TaxRateExplanation`.
 *
 * `wacc`: when `currentPrice` is available (a live quote, passed in by the
 * caller — this function stays a pure, synchronous, testable function and
 * never does I/O itself), this computes an **estimated** debt-weighted
 * WACC via `computeWacc` (reused from `/lib/engine`, never reimplemented)
 * using market value of equity = price × diluted shares, book value of
 * total debt as a *proxy* for its market value, and a pre-tax cost of debt
 * built from `riskFreeRate + costOfDebtSpread` (both explicit, labeled
 * market assumptions) as a *proxy* for a sourced company bond yield. None
 * of that is presented as more precise than it is — see the `*Basis`
 * fields on `WaccExplanation`, which the UI must render, not paraphrase.
 * Without a live price there is no equity-weighting basis at all, so this
 * falls back to CAPM cost of equity used directly as the WACC proxy — the
 * previous behavior, still honestly labeled as a proxy, never presented as
 * the weighted estimate. `beta` is always the explicit, labeled
 * market-average placeholder (1.0) — see `market-assumptions.json` — never
 * a fabricated company-specific figure.
 */
export function buildDefaultAssumptions(
  financials: CompanyFinancials,
  currentPrice: MarketQuote | null = null
): {
  assumptions: Assumptions;
  waccExplanation: WaccExplanation;
  taxRateExplanation: TaxRateExplanation;
} {
  const metrics = deriveHistoricalMetrics(financials.historicals);

  const growthRates = metrics.map((m) => m.revenueGrowth).filter((g): g is number => g !== null);
  const avgRevenueGrowth = growthRates.length > 0 ? growthRates.reduce((sum, g) => sum + g, 0) / growthRates.length : 0;

  const latestMetrics = metrics[metrics.length - 1];
  const latestHistorical = financials.historicals[financials.historicals.length - 1];

  const taxRateExplanation = computeNormalizedTaxRate(financials);

  const costOfEquity = computeCostOfEquity(
    marketAssumptions.riskFreeRate.value,
    marketAssumptions.defaultBeta.value,
    marketAssumptions.equityRiskPremium.value
  );

  const dilutedShares = latestHistorical.dilutedShares.value;
  const totalDebt = latestHistorical.totalDebt.value;

  let wacc: number;
  let waccExplanation: WaccExplanation;

  if (currentPrice && dilutedShares > 0) {
    const marketValueEquity = currentPrice.price * dilutedShares;
    const preTaxCostOfDebt: SourcedValue<number> = {
      value: marketAssumptions.riskFreeRate.value + marketAssumptions.costOfDebtSpread.value,
      source: `Risk-free rate (${marketAssumptions.riskFreeRate.source}) + illustrative credit spread (${marketAssumptions.costOfDebtSpread.source})`,
      asOf: marketAssumptions.costOfDebtSpread.asOf,
    };
    const components: WaccComponents = {
      riskFreeRate: marketAssumptions.riskFreeRate,
      beta: marketAssumptions.defaultBeta,
      equityRiskPremium: marketAssumptions.equityRiskPremium,
      preTaxCostOfDebt,
      marketValueDebt: totalDebt,
      marketValueEquity,
    };

    wacc = computeWacc(components, taxRateExplanation.normalized);
    const totalCapital = marketValueEquity + totalDebt;

    waccExplanation = {
      riskFreeRate: marketAssumptions.riskFreeRate,
      beta: marketAssumptions.defaultBeta,
      equityRiskPremium: marketAssumptions.equityRiskPremium,
      costOfEquity,
      method: "weighted",
      betaBasis: "market-average-placeholder",
      preTaxCostOfDebt,
      costOfDebtBasis: "spread-based-proxy",
      afterTaxCostOfDebt: computeAfterTaxCostOfDebt(preTaxCostOfDebt.value, taxRateExplanation.normalized),
      marketValueEquity,
      debtValueBasis: "book-value-proxy",
      marketValueDebt: totalDebt,
      weightEquity: marketValueEquity / totalCapital,
      weightDebt: totalDebt / totalCapital,
    };
  } else {
    wacc = costOfEquity;
    waccExplanation = {
      riskFreeRate: marketAssumptions.riskFreeRate,
      beta: marketAssumptions.defaultBeta,
      equityRiskPremium: marketAssumptions.equityRiskPremium,
      costOfEquity,
      method: "cost-of-equity-proxy",
      betaBasis: "market-average-placeholder",
    };
  }

  const assumptions: Assumptions = {
    revenueGrowth: avgRevenueGrowth,
    // A company's own most recent historical EBITDA margin, held flat forward.
    ebitdaMargin: latestMetrics.ebitdaMargin ?? 0,
    taxRate: taxRateExplanation.normalized,
    wacc,
    terminalGrowth: marketAssumptions.defaultTerminalGrowth.value,
  };

  return { assumptions, waccExplanation, taxRateExplanation };
}
