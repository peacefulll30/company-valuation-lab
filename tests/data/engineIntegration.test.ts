import { describe, expect, it } from "vitest";
import { companyFinancialsSchema } from "@/lib/schemas";
import { mapToFinancials } from "@/lib/data/edgar/mapToFinancials";
import { runDcf, deriveHistoricalMetrics } from "@/lib/engine";
import { buildCompanyFacts } from "./fixtures";

/**
 * Phase 3 brief item 12 — "successful CompanyFinancials → engine path":
 * proves the data layer's normalized, schema-validated output is actually
 * consumable by `/lib/engine` end to end, not just structurally similar.
 */
describe("normalized CompanyFinancials flows into the engine", () => {
  const facts = buildCompanyFacts();
  const mapped = mapToFinancials(facts, 5);
  if (mapped.status !== "ok") throw new Error("fixture must map successfully for this test");

  const financials = companyFinancialsSchema.parse({
    historicals: mapped.historicals,
    currentPrice: null,
  });

  it("deriveHistoricalMetrics derives EBITDA = EBIT + D&A from the normalized data", () => {
    const metrics = deriveHistoricalMetrics(financials.historicals);
    const y2024 = metrics.find((m) => m.fiscalYear === 2024)!;
    expect(y2024.ebitda).toBeCloseTo(280 + 70, 8); // EBIT + D&A from the fixture
  });

  it("runDcf produces a complete, finite DCF result from normalized data", () => {
    const result = runDcf(financials, {
      revenueGrowth: 0.08,
      ebitdaMargin: 0.25,
      taxRate: 0.2,
      wacc: 0.1,
      terminalGrowth: 0.02,
    });

    expect(result.forecastYears).toHaveLength(5);
    expect(Number.isFinite(result.enterpriseValue)).toBe(true);
    expect(Number.isFinite(result.equityValue)).toBe(true);
    expect(Number.isFinite(result.impliedSharePrice)).toBe(true);
    // Net debt from the fixture's most recent year: totalDebt 550 - cash 400 = 150.
    expect(result.netDebt).toBeCloseTo(150, 8);
  });
});
