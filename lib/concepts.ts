/**
 * Plain-language explanations of the core valuation concepts — the single
 * source of truth reused by both the landing page's scroll story and the
 * in-workspace "What is this?" popovers, so the explanation of "DCF" (say)
 * never quietly drifts between the two. Short and human on purpose: this
 * product explains what it computed, not a finance course.
 */
export type ConceptKey =
  | "historicals"
  | "forecast"
  | "dcf"
  | "wacc"
  | "scenarios"
  | "sensitivity"
  | "comps"
  | "analyst";

export type Concept = {
  label: string;
  summary: string;
};

export const concepts: Record<ConceptKey, Concept> = {
  historicals: {
    label: "Historical financials",
    summary:
      "The company's real, filed results for the last five years — revenue, profit, cash flow. It's the foundation: you can't reasonably forecast a future you don't understand the past of.",
  },
  forecast: {
    label: "Forecast",
    summary:
      "A projection of the next five years, built from assumptions you can see and change — like how fast revenue grows or how much profit margin the business keeps. Change one, and everything downstream updates.",
  },
  dcf: {
    label: "DCF (Discounted Cash Flow)",
    summary:
      "A DCF adds up the cash a company is expected to generate in the future, then discounts it back to what that's worth today — since a dollar next year is worth a little less than a dollar right now.",
  },
  wacc: {
    label: "WACC",
    summary:
      "The annual return investors expect for funding this company, blending the cost of its equity and its debt. It's the discount rate in the DCF — raise it, and every future dollar is worth less today.",
  },
  scenarios: {
    label: "Bear / Base / Bull",
    summary:
      "Base is the central, most-likely case. Bear shows the valuation if growth and margins land worse than expected; Bull shows the upside if they land better — together, a realistic range instead of one guess.",
  },
  sensitivity: {
    label: "Sensitivity",
    summary:
      "Small moves in WACC or the long-term growth rate compound over every future year, so they can shift the valuation a lot. This grid shows exactly how much — and which assumption the model leans on hardest.",
  },
  comps: {
    label: "Trading comps",
    summary:
      "Comparing this company's valuation multiples — price relative to earnings or EBITDA — against similar public companies. A useful cross-check on the DCF, not a replacement for it.",
  },
  analyst: {
    label: "AI Analyst",
    summary:
      "Ask it to explain any part of the model, or test a real “what if.” It recalculates through the same engine as the rest of the app and shows you the actual result — it never makes up a number.",
  },
};
