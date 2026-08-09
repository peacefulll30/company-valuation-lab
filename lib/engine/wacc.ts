import { InvalidAssumptionError } from "./errors";
import type { WaccComponents } from "./types";

/**
 * CAPM cost of equity, after-tax cost of debt, and capital-structure-
 * weighted WACC (PRD FR-30, Architecture §8 `wacc.ts`).
 */
export function computeCostOfEquity(
  riskFreeRate: number,
  beta: number,
  equityRiskPremium: number
): number {
  return riskFreeRate + beta * equityRiskPremium;
}

export function computeAfterTaxCostOfDebt(preTaxCostOfDebt: number, taxRate: number): number {
  return preTaxCostOfDebt * (1 - taxRate);
}

export function computeWacc(components: WaccComponents, taxRate: number): number {
  const { marketValueDebt, marketValueEquity } = components;
  const totalCapital = marketValueDebt + marketValueEquity;
  if (!(totalCapital > 0)) {
    throw new InvalidAssumptionError(
      `Market value of debt + equity must be positive to weight WACC; received debt=${marketValueDebt}, equity=${marketValueEquity}.`
    );
  }

  const costOfEquity = computeCostOfEquity(
    components.riskFreeRate.value,
    components.beta.value,
    components.equityRiskPremium.value
  );
  const afterTaxCostOfDebt = computeAfterTaxCostOfDebt(components.preTaxCostOfDebt.value, taxRate);

  const weightEquity = marketValueEquity / totalCapital;
  const weightDebt = marketValueDebt / totalCapital;

  return weightEquity * costOfEquity + weightDebt * afterTaxCostOfDebt;
}
