import { deriveEbitda } from "./identities";
import type { HistoricalMetrics } from "./results";
import type { FinancialLineItems } from "./types";
import { requireSourcedNumber } from "./validate";

/**
 * Derives per-year historical metrics (PRD FR-11/FR-12) from filed line
 * items. EBITDA is always derived (EBIT + D&A) here — a company's own
 * reported EBITDA is a UI-layer cross-check, never substituted in (CLAUDE.md
 * invariant #3), so this module has no path that accepts one.
 */
export function deriveHistoricalMetrics(historicals: FinancialLineItems[]): HistoricalMetrics[] {
  return historicals.map((year, index) => {
    const revenue = requireSourcedNumber(`historicals[${index}].revenue`, year.revenue);
    const ebit = requireSourcedNumber(`historicals[${index}].ebit`, year.ebit);
    const da = requireSourcedNumber(`historicals[${index}].da`, year.da);
    const netIncome = requireSourcedNumber(`historicals[${index}].netIncome`, year.netIncome);
    const operatingCashFlow = requireSourcedNumber(
      `historicals[${index}].operatingCashFlow`,
      year.operatingCashFlow
    );
    const capex = requireSourcedNumber(`historicals[${index}].capex`, year.capex);
    const totalDebt = requireSourcedNumber(`historicals[${index}].totalDebt`, year.totalDebt);
    const cash = requireSourcedNumber(`historicals[${index}].cash`, year.cash);
    // Same Net Debt definition as the DCF bridge (`bridge.ts`) — cash-like
    // investments (marketable securities) net out when reliably mapped,
    // excluded (not assumed zero) when not, so this tab's ratio and the
    // DCF tab's bridge never quietly disagree on what "Net Debt" means.
    const cashLikeInvestments = year.cashLikeInvestments?.value ?? 0;

    const ebitda = deriveEbitda(ebit, da);
    const freeCashFlow = operatingCashFlow - capex;
    const netDebt = totalDebt - cash - cashLikeInvestments;

    const priorRevenue =
      index > 0
        ? requireSourcedNumber(`historicals[${index - 1}].revenue`, historicals[index - 1].revenue)
        : null;

    return {
      fiscalYear: year.fiscalYear,
      ebitda,
      revenueGrowth: priorRevenue && priorRevenue !== 0 ? revenue / priorRevenue - 1 : null,
      ebitdaMargin: revenue !== 0 ? ebitda / revenue : null,
      ebitMargin: revenue !== 0 ? ebit / revenue : null,
      netMargin: revenue !== 0 ? netIncome / revenue : null,
      freeCashFlow,
      fcfMargin: revenue !== 0 ? freeCashFlow / revenue : null,
      fcfConversion: ebitda !== 0 ? freeCashFlow / ebitda : null,
      netDebtToEbitda: ebitda !== 0 ? netDebt / ebitda : null,
    };
  });
}
