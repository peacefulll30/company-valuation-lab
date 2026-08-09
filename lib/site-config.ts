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
 * Placeholder-only capability grid for the Landing page. No financial
 * figures — see CLAUDE.md "Do not invent live company data."
 */
export const capabilities = [
  {
    title: "Historical analysis",
    description:
      "Five years of filed financials, with margins, growth, and leverage derived — not re-entered.",
  },
  {
    title: "Forecasting",
    description:
      "A five-year forecast with five mandatory assumptions visible by default, deeper controls tucked behind Advanced.",
  },
  {
    title: "DCF, scenarios & sensitivity",
    description:
      "A full UFCF-to-share-price bridge, Bear/Base/Bull scenarios, and a WACC × growth sensitivity grid.",
  },
  {
    title: "AI Analyst",
    description:
      "Explains what the model computed and why — it never calculates a number on its own.",
  },
] as const;

export const methodologySteps = [
  { step: "01", label: "Historicals", detail: "Five years, sourced and dated." },
  { step: "02", label: "Forecast", detail: "Assumptions you can see and change." },
  { step: "03", label: "DCF", detail: "UFCF discounted at WACC to a share price." },
  {
    step: "04",
    label: "Scenarios & Sensitivity",
    detail: "How much the answer moves, and why.",
  },
] as const;
