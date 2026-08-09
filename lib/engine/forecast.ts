import { deriveEbit } from "./identities";
import type { ForecastLineItems } from "./results";
import type { Assumptions, FinancialLineItems } from "./types";
import { requireSourcedNumber } from "./validate";

export const FORECAST_YEARS = 5;

/**
 * Generates the 5-year forecast line-item build (PRD FR-15/FR-16) from the
 * most recent historical year plus Assumptions. Tax and discounting are
 * deliberately not applied here — dcf.ts composes this output with
 * nopat.ts/ufcf.ts, so "forecast generation" stays one isolated,
 * independently testable step (Architecture §8).
 *
 * Modeling choices made explicit here (none are specified numerically in
 * the PRD/Architecture, so these are documented Phase 2 defaults, not
 * locked invariants):
 * - `marginTrajectory` other than "flat" is not yet implemented — every
 *   forecast year uses the single mandatory `ebitdaMargin` value. No ramp/
 *   fade slope is specified anywhere in the docs to implement against.
 * - `daPctRevenue`/`capexPctRevenue` are applied flat against that year's
 *   revenue; if not supplied via `assumptions.advanced`, they default to
 *   the most recent historical year's own ratio.
 * - `nwcPctRevenue` is treated as a working-capital *level* (% of revenue),
 *   with ΔNWC derived as the year-over-year change in that level — the
 *   standard treatment, and distinct from treating it as a flat ΔNWC-per-
 *   year percentage. Default, if not supplied, is the historical average
 *   of deltaNWC/revenue across the given historical years.
 */
export function generateForecast(
  historicals: FinancialLineItems[],
  assumptions: Assumptions
): ForecastLineItems[] {
  if (historicals.length === 0) {
    throw new Error("generateForecast requires at least one historical year as the forecast base.");
  }

  const baseYear = historicals[historicals.length - 1];
  const baseRevenue = requireSourcedNumber("historicals[base].revenue", baseYear.revenue);
  const baseDa = requireSourcedNumber("historicals[base].da", baseYear.da);
  const baseCapex = requireSourcedNumber("historicals[base].capex", baseYear.capex);

  const daPctRevenue = assumptions.advanced?.daPctRevenue ?? baseDa / baseRevenue;
  const capexPctRevenue = assumptions.advanced?.capexPctRevenue ?? baseCapex / baseRevenue;
  const nwcPctRevenue = assumptions.advanced?.nwcPctRevenue ?? defaultNwcPctRevenue(historicals);

  const years: ForecastLineItems[] = [];
  let priorRevenue = baseRevenue;
  let priorNwcLevel = baseRevenue * nwcPctRevenue;

  for (let year = 1; year <= FORECAST_YEARS; year++) {
    const revenue = priorRevenue * (1 + assumptions.revenueGrowth);
    const ebitda = revenue * assumptions.ebitdaMargin;
    const da = revenue * daPctRevenue;
    const ebit = deriveEbit(ebitda, da);
    const capex = revenue * capexPctRevenue;
    const nwcLevel = revenue * nwcPctRevenue;
    const deltaNWC = nwcLevel - priorNwcLevel;

    years.push({ year, revenue, ebitda, ebit, da, capex, deltaNWC });

    priorRevenue = revenue;
    priorNwcLevel = nwcLevel;
  }

  return years;
}

function defaultNwcPctRevenue(historicals: FinancialLineItems[]): number {
  const ratios = historicals
    .map((y) => {
      const revenue = requireSourcedNumber("historicals[].revenue", y.revenue);
      const deltaNWC = requireSourcedNumber("historicals[].deltaNWC", y.deltaNWC);
      return revenue !== 0 ? deltaNWC / revenue : null;
    })
    .filter((ratio): ratio is number => ratio !== null);

  if (ratios.length === 0) return 0;
  return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
}
