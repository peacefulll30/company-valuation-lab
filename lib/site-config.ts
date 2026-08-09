export const siteConfig = {
  name: "Company Valuation Lab",
  tagline: "What is this company actually worth — and how confident should you be?",
  description:
    "Company Valuation Lab builds a full DCF, WACC, scenario, and sensitivity model from real filings — then shows exactly which assumptions are driving the answer.",
  disclaimer:
    "Model-based estimates for research and portfolio purposes. Not investment advice.",
} as const;

/**
 * The 9 addressable workspace tabs (Architecture §2, §13). WACC is
 * intentionally absent — it is a panel inside Forecast and DCF, not a
 * separate route (Design spec, cross-reference note).
 */
export const workspaceSections = [
  { slug: "overview", label: "Overview", step: "01" },
  { slug: "historicals", label: "Historical Financials", step: "02" },
  { slug: "forecast", label: "Forecast", step: "03" },
  { slug: "dcf", label: "DCF", step: "04" },
  { slug: "scenarios", label: "Scenarios", step: "05" },
  { slug: "sensitivity", label: "Sensitivity", step: "06" },
  { slug: "comps", label: "Trading Comps", step: "07" },
  { slug: "summary", label: "Valuation Summary", step: "08" },
  { slug: "analyst", label: "AI Analyst", step: "09" },
] as const;

export type WorkspaceSectionSlug = (typeof workspaceSections)[number]["slug"];

/**
 * Landing capability story (Design spec §2 marketing shell) — no financial
 * figures, see CLAUDE.md "Do not invent live company data." Descriptions
 * fold in a plain-language explanation of the underlying concept (reusing
 * the same idea as `lib/concepts.ts`, kept product-framed here rather than
 * imported verbatim, since this is "what the platform does" not "what the
 * term means" — the in-workspace popovers own the literal definitions).
 */
export const capabilities = [
  {
    step: "01",
    title: "Historical analysis",
    description:
      "Five years of a company's real, filed results — revenue, profit, cash flow — with margins and growth derived, not re-entered. You can't forecast a future you don't understand the past of.",
  },
  {
    step: "02",
    title: "Forecasting",
    description:
      "A five-year forecast built from assumptions you can see and change — how fast revenue grows, how much margin it keeps. Five mandatory inputs, deeper controls tucked behind Advanced.",
  },
  {
    step: "03",
    title: "DCF, scenarios & sensitivity",
    description:
      "A full cash-flow-to-share-price bridge, discounted at WACC. Bear/Base/Bull frame a realistic range instead of one guess; the sensitivity grid shows exactly what the answer leans on.",
  },
  {
    step: "04",
    title: "AI Analyst",
    description:
      "Ask it to explain any part of the model, or test a real what-if — it recalculates through the same engine as the rest of the app. It never invents a number of its own.",
  },
] as const;

export const methodologySteps = [
  {
    step: "01",
    label: "Historicals",
    detail: "Five years, sourced and dated — the foundation everything else builds on.",
  },
  {
    step: "02",
    label: "Forecast",
    detail: "Assumptions you can see and change, projected five years forward.",
  },
  {
    step: "03",
    label: "DCF",
    detail: "Future cash flow, discounted at WACC, to what it's worth today.",
  },
  {
    step: "04",
    label: "Scenarios & Sensitivity",
    detail: "How much the answer moves if growth, margin, or WACC shift — and why.",
  },
] as const;
