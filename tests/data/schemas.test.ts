import { describe, expect, it } from "vitest";
import {
  assumptionsSchema,
  companyFinancialsSchema,
  companyMetaSchema,
  featuredCompanyRecordSchema,
  financialLineItemsSchema,
  waccComponentsSchema,
  type AssumptionsInput,
  type CompanyFinancialsInput,
  type FinancialLineItemsInput,
  type WaccComponentsInput,
} from "@/lib/schemas";
import type { Assumptions, CompanyFinancials, FinancialLineItems, WaccComponents } from "@/lib/engine/types";
import { buildCompanyFacts } from "./fixtures";
import { mapToFinancials } from "@/lib/data/edgar";

describe("schema compatibility with lib/engine/types.ts", () => {
  it("a Zod-parsed FinancialLineItems is assignable to the engine's FinancialLineItems type", () => {
    // Compile-time only — this test's real assertion is that `tsc`/`next build`
    // accept the annotation below without error (see mapToFinancials data too).
    const parsed: FinancialLineItemsInput = financialLineItemsSchema.parse({
      fiscalYear: 2024,
      revenue: { value: 100, source: "s", asOf: "2024-01-01" },
      ebit: { value: 20, source: "s", asOf: "2024-01-01" },
      da: { value: 5, source: "s", asOf: "2024-01-01" },
      taxRate: { value: 0.2, source: "s", asOf: "2024-01-01" },
      netIncome: { value: 12, source: "s", asOf: "2024-01-01" },
      cash: { value: 30, source: "s", asOf: "2024-01-01" },
      totalDebt: { value: 50, source: "s", asOf: "2024-01-01" },
      dilutedShares: { value: 10, source: "s", asOf: "2024-01-01" },
      operatingCashFlow: { value: 22, source: "s", asOf: "2024-01-01" },
      capex: { value: 6, source: "s", asOf: "2024-01-01" },
      deltaNWC: { value: 1, source: "s", asOf: "2024-01-01" },
    });
    const asEngineType: FinancialLineItems = parsed;
    expect(asEngineType.fiscalYear).toBe(2024);
  });

  it("a Zod-parsed CompanyFinancials is assignable to the engine's CompanyFinancials type", () => {
    const facts = buildCompanyFacts();
    const mapped = mapToFinancials(facts, 5);
    if (mapped.status !== "ok") throw new Error("fixture should map successfully");

    const parsed: CompanyFinancialsInput = companyFinancialsSchema.parse({
      historicals: mapped.historicals,
      currentPrice: null,
    });
    const asEngineType: CompanyFinancials = parsed;
    expect(asEngineType.historicals).toHaveLength(5);
  });

  it("a Zod-parsed Assumptions is assignable to the engine's Assumptions type", () => {
    const parsed: AssumptionsInput = assumptionsSchema.parse({
      revenueGrowth: 0.1,
      ebitdaMargin: 0.25,
      taxRate: 0.25,
      wacc: 0.1,
      terminalGrowth: 0.02,
    });
    const asEngineType: Assumptions = parsed;
    expect(asEngineType.wacc).toBe(0.1);
  });

  it("a Zod-parsed WaccComponents is assignable to the engine's WaccComponents type", () => {
    const parsed: WaccComponentsInput = waccComponentsSchema.parse({
      riskFreeRate: { value: 0.04, source: "s", asOf: "2024-01-01" },
      beta: { value: 1.1, source: "s", asOf: "2024-01-01" },
      equityRiskPremium: { value: 0.05, source: "s", asOf: "2024-01-01" },
      preTaxCostOfDebt: { value: 0.06, source: "s", asOf: "2024-01-01" },
      marketValueDebt: 100,
      marketValueEquity: 900,
    });
    const asEngineType: WaccComponents = parsed;
    expect(asEngineType.marketValueDebt).toBe(100);
  });
});

describe("schema validation rejects missing/invalid required data (never defaults to 0)", () => {
  it("rejects a SourcedValue with a non-finite value", () => {
    const result = financialLineItemsSchema.safeParse({
      fiscalYear: 2024,
      revenue: { value: Number.NaN, source: "s", asOf: "2024-01-01" },
      ebit: { value: 20, source: "s", asOf: "2024-01-01" },
      da: { value: 5, source: "s", asOf: "2024-01-01" },
      taxRate: { value: 0.2, source: "s", asOf: "2024-01-01" },
      netIncome: { value: 12, source: "s", asOf: "2024-01-01" },
      cash: { value: 30, source: "s", asOf: "2024-01-01" },
      totalDebt: { value: 50, source: "s", asOf: "2024-01-01" },
      dilutedShares: { value: 10, source: "s", asOf: "2024-01-01" },
      operatingCashFlow: { value: 22, source: "s", asOf: "2024-01-01" },
      capex: { value: 6, source: "s", asOf: "2024-01-01" },
      deltaNWC: { value: 1, source: "s", asOf: "2024-01-01" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a FinancialLineItems missing a required field entirely (no default(0))", () => {
    const full: Record<string, unknown> = {
      fiscalYear: 2024,
      revenue: { value: 100, source: "s", asOf: "2024-01-01" },
      ebit: { value: 20, source: "s", asOf: "2024-01-01" },
      da: { value: 5, source: "s", asOf: "2024-01-01" },
      taxRate: { value: 0.2, source: "s", asOf: "2024-01-01" },
      netIncome: { value: 12, source: "s", asOf: "2024-01-01" },
      cash: { value: 30, source: "s", asOf: "2024-01-01" },
      totalDebt: { value: 50, source: "s", asOf: "2024-01-01" },
      dilutedShares: { value: 10, source: "s", asOf: "2024-01-01" },
      operatingCashFlow: { value: 22, source: "s", asOf: "2024-01-01" },
      capex: { value: 6, source: "s", asOf: "2024-01-01" },
      deltaNWC: { value: 1, source: "s", asOf: "2024-01-01" },
    };
    delete full.revenue;
    const result = financialLineItemsSchema.safeParse(full);
    expect(result.success).toBe(false);
  });

  it("rejects a SourcedValue missing its source or asOf", () => {
    const result = financialLineItemsSchema.shape.revenue.safeParse({ value: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects a CompanyFinancials with an empty historicals array", () => {
    const result = companyFinancialsSchema.safeParse({ historicals: [], currentPrice: null });
    expect(result.success).toBe(false);
  });

  it("accepts currentPrice: null (price unavailable is valid, not an error)", () => {
    const facts = buildCompanyFacts();
    const mapped = mapToFinancials(facts, 5);
    if (mapped.status !== "ok") throw new Error("fixture should map successfully");
    const result = companyFinancialsSchema.safeParse({ historicals: mapped.historicals, currentPrice: null });
    expect(result.success).toBe(true);
  });
});

describe("companyMetaSchema / featuredCompanyRecordSchema", () => {
  it("validates a full Featured record end to end", () => {
    const facts = buildCompanyFacts();
    const mapped = mapToFinancials(facts, 5);
    if (mapped.status !== "ok") throw new Error("fixture should map successfully");

    const record = {
      meta: {
        ticker: "TEST",
        cik: "0001234567",
        name: "Test Corp",
        sector: "Testing",
        sicCode: "3571",
        description: "Test Corp — SIC 3571",
        tier: "featured",
        peerTickers: [],
      },
      financials: { historicals: mapped.historicals, currentPrice: null },
      provenance: mapped.provenance,
      generatedAt: new Date().toISOString(),
    };

    expect(() => featuredCompanyRecordSchema.parse(record)).not.toThrow();
  });

  it("rejects an unknown tier value", () => {
    const result = companyMetaSchema.safeParse({
      ticker: "TEST",
      cik: "1",
      name: "Test",
      sector: "Test",
      sicCode: "3571",
      description: "",
      tier: "bogus",
      peerTickers: [],
    });
    expect(result.success).toBe(false);
  });
});
