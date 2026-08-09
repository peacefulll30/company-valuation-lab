import { bridgeEnterpriseValueToSharePrice } from "./bridge";
import { generateForecast } from "./forecast";
import { computeNopat } from "./nopat";
import type { DCFResult, ForecastYear } from "./results";
import { computeTerminalValue } from "./terminalValue";
import type { Assumptions, CompanyFinancials } from "./types";
import { computeUfcf } from "./ufcf";
import { assertWaccExceedsGrowth, requireSourcedNumber } from "./validate";

/**
 * Discounts a year-N cash flow at WACC. End-of-year convention (exponent =
 * year) by default; `midYearConvention` shifts every exponent — including
 * the terminal value's — back half a year, the common simplified treatment
 * (FR-21).
 */
function discountFactor(wacc: number, year: number, midYear: boolean): number {
  const exponent = midYear ? year - 0.5 : year;
  return 1 / Math.pow(1 + wacc, exponent);
}

/**
 * Orchestrates forecast → NOPAT/UFCF → discounting → terminal value → the
 * EV→Equity Value→Share Price bridge (Architecture §8 `dcf.ts`). The single
 * function every other engine module (scenarios, sensitivity) calls —
 * never re-implemented at those call sites.
 */
export function runDcf(company: CompanyFinancials, assumptions: Assumptions): DCFResult {
  assertWaccExceedsGrowth(assumptions.wacc, assumptions.terminalGrowth);

  const baseYear = company.historicals[company.historicals.length - 1];
  const totalDebt = requireSourcedNumber("historicals[base].totalDebt", baseYear.totalDebt);
  const cash = requireSourcedNumber("historicals[base].cash", baseYear.cash);
  const dilutedShares = requireSourcedNumber(
    "historicals[base].dilutedShares",
    baseYear.dilutedShares
  );

  const midYear = assumptions.advanced?.midYearConvention ?? false;
  const forecastLineItems = generateForecast(company.historicals, assumptions);

  const forecastYears: ForecastYear[] = forecastLineItems.map((item) => {
    const nopat = computeNopat(item.ebit, assumptions.taxRate);
    const ufcf = computeUfcf(nopat, item.da, item.capex, item.deltaNWC);
    return { ...item, nopat, ufcf };
  });

  const presentValueOfUfcf = forecastYears.reduce(
    (sum, year) => sum + year.ufcf * discountFactor(assumptions.wacc, year.year, midYear),
    0
  );

  const finalYear = forecastYears[forecastYears.length - 1];
  const terminalValue = computeTerminalValue(
    finalYear.ufcf,
    finalYear.ebitda,
    assumptions.wacc,
    assumptions.terminalGrowth,
    assumptions.advanced?.exitMultiple
  );
  const presentValueOfTerminalValue =
    terminalValue.perpetuity * discountFactor(assumptions.wacc, forecastYears.length, midYear);

  const enterpriseValue = presentValueOfUfcf + presentValueOfTerminalValue;

  const { netDebt, equityValue, impliedSharePrice } = bridgeEnterpriseValueToSharePrice(
    enterpriseValue,
    totalDebt,
    cash,
    dilutedShares
  );

  return {
    forecastYears,
    terminalValue,
    enterpriseValue,
    netDebt,
    equityValue,
    impliedSharePrice,
  };
}
