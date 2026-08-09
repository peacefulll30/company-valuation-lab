import type { ValuationModelState } from "@/lib/engine/results";
import type { WorkspaceSectionSlug } from "@/lib/site-config";

export type CitationUnit = "currency" | "compactCurrency" | "percent" | "multiple" | "plain";

export type CitationDefinition = {
  key: string;
  label: string;
  tab: WorkspaceSectionSlug;
  unit: CitationUnit;
  get: (modelState: ValuationModelState) => number | null;
};

/**
 * The fixed vocabulary of model-state figures the AI Analyst is allowed to
 * cite (Design spec §6 — "any number the AI cites renders as an inline
 * chip pulled from the actual model state ... never typed as plain prose
 * text"). The model is told these keys in the system prompt and asked to
 * reference `{{cite:KEY}}` instead of typing digits; the client then looks
 * the value up here — straight from its own live `ValuationModelState` —
 * so a rendered number is always the engine's actual output, never
 * whatever digits the model happened to generate (CLAUDE.md — the AI
 * never computes a financial number).
 */
export const CITATION_DEFINITIONS: CitationDefinition[] = [
  { key: "currentPrice", label: "Current price", tab: "overview", unit: "currency", get: (m) => m.company.currentPrice?.value ?? null },

  {
    key: "hist.latestRevenue",
    label: "Latest revenue",
    tab: "historicals",
    unit: "compactCurrency",
    get: (m) => m.company.historicals.at(-1)?.revenue.value ?? null,
  },
  {
    key: "hist.latestEbitda",
    label: "Latest EBITDA (derived)",
    tab: "historicals",
    unit: "compactCurrency",
    get: (m) => m.historicalMetrics.at(-1)?.ebitda ?? null,
  },
  {
    key: "hist.latestEbitdaMargin",
    label: "Latest EBITDA margin",
    tab: "historicals",
    unit: "percent",
    get: (m) => m.historicalMetrics.at(-1)?.ebitdaMargin ?? null,
  },
  {
    key: "hist.latestRevenueGrowth",
    label: "Latest revenue growth",
    tab: "historicals",
    unit: "percent",
    get: (m) => m.historicalMetrics.at(-1)?.revenueGrowth ?? null,
  },
  {
    key: "hist.latestFreeCashFlow",
    label: "Latest free cash flow",
    tab: "historicals",
    unit: "compactCurrency",
    get: (m) => m.historicalMetrics.at(-1)?.freeCashFlow ?? null,
  },
  {
    key: "hist.netDebtToEbitda",
    label: "Net debt / EBITDA",
    tab: "historicals",
    unit: "multiple",
    get: (m) => m.historicalMetrics.at(-1)?.netDebtToEbitda ?? null,
  },

  {
    key: "assumptions.revenueGrowth",
    label: "Assumed revenue growth",
    tab: "forecast",
    unit: "percent",
    get: (m) => m.assumptions.revenueGrowth,
  },
  {
    key: "assumptions.ebitdaMargin",
    label: "Assumed EBITDA margin",
    tab: "forecast",
    unit: "percent",
    get: (m) => m.assumptions.ebitdaMargin,
  },
  {
    key: "assumptions.taxRate",
    label: "Tax rate",
    tab: "forecast",
    unit: "percent",
    get: (m) => m.assumptions.taxRate,
  },
  {
    key: "forecast.year1Revenue",
    label: "Forecast year 1 revenue",
    tab: "forecast",
    unit: "compactCurrency",
    get: (m) => m.dcf.forecastYears[0]?.revenue ?? null,
  },
  {
    key: "forecast.finalYearRevenue",
    label: "Forecast final-year revenue",
    tab: "forecast",
    unit: "compactCurrency",
    get: (m) => m.dcf.forecastYears.at(-1)?.revenue ?? null,
  },
  {
    key: "forecast.finalYearUfcf",
    label: "Forecast final-year unlevered FCF",
    tab: "forecast",
    unit: "compactCurrency",
    get: (m) => m.dcf.forecastYears.at(-1)?.ufcf ?? null,
  },

  { key: "assumptions.wacc", label: "WACC", tab: "dcf", unit: "percent", get: (m) => m.assumptions.wacc },
  {
    key: "assumptions.terminalGrowth",
    label: "Terminal growth rate",
    tab: "dcf",
    unit: "percent",
    get: (m) => m.assumptions.terminalGrowth,
  },
  { key: "dcf.enterpriseValue", label: "Enterprise value", tab: "dcf", unit: "compactCurrency", get: (m) => m.dcf.enterpriseValue },
  { key: "dcf.netDebt", label: "Net debt", tab: "dcf", unit: "compactCurrency", get: (m) => m.dcf.netDebt },
  { key: "dcf.equityValue", label: "Equity value", tab: "dcf", unit: "compactCurrency", get: (m) => m.dcf.equityValue },
  {
    key: "dcf.impliedSharePrice",
    label: "Base-case implied share price",
    tab: "dcf",
    unit: "currency",
    get: (m) => m.dcf.impliedSharePrice,
  },
  {
    key: "dcf.terminalValuePerpetuity",
    label: "Terminal value (perpetuity)",
    tab: "dcf",
    unit: "compactCurrency",
    get: (m) => m.dcf.terminalValue.perpetuity,
  },
  {
    key: "dcf.terminalValueExitMultiple",
    label: "Terminal value (exit multiple)",
    tab: "dcf",
    unit: "compactCurrency",
    get: (m) => m.dcf.terminalValue.exitMultiple,
  },

  {
    key: "scenarios.bear.impliedSharePrice",
    label: "Bear-case implied share price",
    tab: "scenarios",
    unit: "currency",
    get: (m) => m.scenarios.bear.impliedSharePrice,
  },
  {
    key: "scenarios.base.impliedSharePrice",
    label: "Base-case implied share price",
    tab: "scenarios",
    unit: "currency",
    get: (m) => m.scenarios.base.impliedSharePrice,
  },
  {
    key: "scenarios.bull.impliedSharePrice",
    label: "Bull-case implied share price",
    tab: "scenarios",
    unit: "currency",
    get: (m) => m.scenarios.bull.impliedSharePrice,
  },

  {
    key: "comps.subjectEvEbitda",
    label: "EV / EBITDA",
    tab: "comps",
    unit: "multiple",
    get: (m) => m.comps?.subject.evEbitda ?? null,
  },
  {
    key: "comps.impliedRangeLow",
    label: "Comps-implied range (low)",
    tab: "comps",
    unit: "currency",
    get: (m) => m.comps?.impliedRange?.low ?? null,
  },
  {
    key: "comps.impliedRangeHigh",
    label: "Comps-implied range (high)",
    tab: "comps",
    unit: "currency",
    get: (m) => m.comps?.impliedRange?.high ?? null,
  },
];

const CITATION_BY_KEY = new Map(CITATION_DEFINITIONS.map((def) => [def.key, def]));

export type ResolvedCitation = { key: string; label: string; tab: WorkspaceSectionSlug; unit: CitationUnit; value: number } | null;

/** Looks up and evaluates a citation key against the caller's own live model state — never against AI-generated text. */
export function resolveCitation(modelState: ValuationModelState, key: string): ResolvedCitation {
  const def = CITATION_BY_KEY.get(key);
  if (!def) return null;
  const value = def.get(modelState);
  if (value === null || !Number.isFinite(value)) return null;
  return { key: def.key, label: def.label, tab: def.tab, unit: def.unit, value };
}

const CITATION_TOKEN = /\{\{cite:([a-zA-Z0-9_.]+)\}\}/g;

export type MessageSegment = { type: "text"; value: string } | { type: "citation"; key: string };

/** Splits assistant prose on `{{cite:KEY}}` tokens (Design spec §6) — pure, so a message can be rendered anywhere, tested without React. */
export function splitCitationTokens(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(CITATION_TOKEN)) {
    const index = match.index;
    if (index > lastIndex) segments.push({ type: "text", value: text.slice(lastIndex, index) });
    segments.push({ type: "citation", key: match[1] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ type: "text", value: text.slice(lastIndex) });
  return segments;
}
