import { computeCostOfEquity, deriveHistoricalMetrics } from "@/lib/engine";
import type { Assumptions, CompanyFinancials, SourcedValue } from "@/lib/engine/types";
import { marketAssumptions } from "@/lib/market-assumptions";

export type WaccExplanation = {
  riskFreeRate: SourcedValue<number>;
  beta: SourcedValue<number>;
  equityRiskPremium: SourcedValue<number>;
  /** Cost of equity (CAPM), used directly as the WACC proxy — see note below. */
  costOfEquity: number;
};

/**
 * Builds the mandatory default Assumptions for a Featured company from its
 * own real historicals plus the shared market-assumption defaults.
 *
 * `revenueGrowth`/`ebitdaMargin`/`taxRate` are entirely company-specific and
 * real (derived from the company's own filed history via
 * `deriveHistoricalMetrics` — no external input). `wacc` uses the CAPM cost
 * of equity (`computeCostOfEquity`, reused from `/lib/engine`, never
 * reimplemented) as a direct WACC proxy: a true debt-weighted WACC needs
 * the market value of equity (price × diluted shares), and price is
 * honestly unavailable in this phase (no fabricated market prices per
 * CLAUDE.md) — so there is no real weighting basis yet. `beta` is an
 * explicit, labeled market-average placeholder (1.0), not a fabricated
 * company-specific figure — see `market-assumptions.json`.
 */
export function buildDefaultAssumptions(financials: CompanyFinancials): {
  assumptions: Assumptions;
  waccExplanation: WaccExplanation;
} {
  const metrics = deriveHistoricalMetrics(financials.historicals);

  const growthRates = metrics
    .map((m) => m.revenueGrowth)
    .filter((g): g is number => g !== null);
  const avgRevenueGrowth =
    growthRates.length > 0 ? growthRates.reduce((sum, g) => sum + g, 0) / growthRates.length : 0;

  const latestMetrics = metrics[metrics.length - 1];
  const latestHistorical = financials.historicals[financials.historicals.length - 1];

  const costOfEquity = computeCostOfEquity(
    marketAssumptions.riskFreeRate.value,
    marketAssumptions.defaultBeta.value,
    marketAssumptions.equityRiskPremium.value
  );

  const assumptions: Assumptions = {
    revenueGrowth: avgRevenueGrowth,
    // A company's own most recent historical EBITDA margin, held flat forward.
    ebitdaMargin: latestMetrics.ebitdaMargin ?? 0,
    taxRate: latestHistorical.taxRate.value,
    wacc: costOfEquity,
    terminalGrowth: marketAssumptions.defaultTerminalGrowth.value,
  };

  return {
    assumptions,
    waccExplanation: {
      riskFreeRate: marketAssumptions.riskFreeRate,
      beta: marketAssumptions.defaultBeta,
      equityRiskPremium: marketAssumptions.equityRiskPremium,
      costOfEquity,
    },
  };
}
