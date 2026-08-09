import type { CompanyMetaInput } from "@/lib/schemas";
import type { ValuationModelState } from "@/lib/engine/results";

/**
 * A compact, JSON-serializable projection of `ValuationModelState` — the
 * exact numeric grounding context handed to the AI Analyst (Architecture
 * §9), both as system-prompt context and as a `recalculateValuation` tool
 * result. Deliberately smaller than the full engine output (trims the raw
 * `SourcedValue` wrappers and the full 5-year `FinancialLineItems` detail)
 * so the model gets every number it needs to answer without an oversized
 * context payload — never a reformulation of any formula, purely a
 * reshaping of numbers the engine already computed.
 */
export type AnalystSnapshot = {
  company: { ticker: string; name: string; sector: string; tier: "featured" | "searched" };
  currentPrice: number | null;
  assumptions: {
    revenueGrowth: number;
    ebitdaMargin: number;
    taxRate: number;
    wacc: number;
    terminalGrowth: number;
  };
  historicals: Array<{
    fiscalYear: number;
    revenue: number;
    ebitda: number;
    revenueGrowth: number | null;
    ebitdaMargin: number | null;
    freeCashFlow: number;
    netDebtToEbitda: number | null;
  }>;
  forecast: Array<{ year: number; revenue: number; ebitda: number; ufcf: number }>;
  dcf: {
    enterpriseValue: number;
    netDebt: number;
    equityValue: number;
    impliedSharePrice: number;
    terminalValuePerpetuity: number;
    terminalValueExitMultiple: number | null;
    terminalValueDivergenceFlag: boolean;
  };
  scenarios: {
    bear: { impliedSharePrice: number };
    base: { impliedSharePrice: number };
    bull: { impliedSharePrice: number };
  };
  sensitivity: { waccSteps: number[]; growthSteps: number[]; cells: (number | null)[][] };
  comps: {
    subjectEvEbitda: number | null;
    subjectEvRevenue: number | null;
    subjectPeRatio: number | null;
    peerCount: number;
    impliedRangeLow: number | null;
    impliedRangeHigh: number | null;
  } | null;
};

export function buildAnalystSnapshot(modelState: ValuationModelState, meta: CompanyMetaInput): AnalystSnapshot {
  const { company, assumptions, historicalMetrics, dcf, scenarios, sensitivity, comps } = modelState;

  return {
    company: { ticker: meta.ticker, name: meta.name, sector: meta.sector, tier: meta.tier },
    currentPrice: company.currentPrice?.value ?? null,
    assumptions: {
      revenueGrowth: assumptions.revenueGrowth,
      ebitdaMargin: assumptions.ebitdaMargin,
      taxRate: assumptions.taxRate,
      wacc: assumptions.wacc,
      terminalGrowth: assumptions.terminalGrowth,
    },
    historicals: historicalMetrics.map((m, index) => ({
      fiscalYear: m.fiscalYear,
      revenue: company.historicals[index].revenue.value,
      ebitda: m.ebitda,
      revenueGrowth: m.revenueGrowth,
      ebitdaMargin: m.ebitdaMargin,
      freeCashFlow: m.freeCashFlow,
      netDebtToEbitda: m.netDebtToEbitda,
    })),
    forecast: dcf.forecastYears.map((year) => ({
      year: year.year,
      revenue: year.revenue,
      ebitda: year.ebitda,
      ufcf: year.ufcf,
    })),
    dcf: {
      enterpriseValue: dcf.enterpriseValue,
      netDebt: dcf.netDebt,
      equityValue: dcf.equityValue,
      impliedSharePrice: dcf.impliedSharePrice,
      terminalValuePerpetuity: dcf.terminalValue.perpetuity,
      terminalValueExitMultiple: dcf.terminalValue.exitMultiple,
      terminalValueDivergenceFlag: dcf.terminalValue.divergenceFlag,
    },
    scenarios: {
      bear: { impliedSharePrice: scenarios.bear.impliedSharePrice },
      base: { impliedSharePrice: scenarios.base.impliedSharePrice },
      bull: { impliedSharePrice: scenarios.bull.impliedSharePrice },
    },
    sensitivity: {
      waccSteps: sensitivity.waccSteps,
      growthSteps: sensitivity.growthSteps,
      cells: sensitivity.cells,
    },
    comps: comps
      ? {
          subjectEvEbitda: comps.subject.evEbitda,
          subjectEvRevenue: comps.subject.evRevenue,
          subjectPeRatio: comps.subject.peRatio,
          peerCount: comps.peers.length,
          impliedRangeLow: comps.impliedRange?.low ?? null,
          impliedRangeHigh: comps.impliedRange?.high ?? null,
        }
      : null,
  };
}
