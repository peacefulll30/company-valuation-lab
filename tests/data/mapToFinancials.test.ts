import { describe, expect, it } from "vitest";
import { mapToFinancials } from "@/lib/data/edgar/mapToFinancials";
import { buildCompanyFacts, EXPECTED_DELTA_NWC, EXPECTED_TAX_RATE, WANTED_YEARS } from "./fixtures";

describe("mapToFinancials — successful normalization", () => {
  const result = mapToFinancials(buildCompanyFacts(), 5);

  it("resolves exactly 5 years, oldest first", () => {
    if (result.status !== "ok") throw new Error(`expected ok, got ${result.status}`);
    expect(result.historicals.map((h) => h.fiscalYear)).toEqual(WANTED_YEARS);
  });

  it("maps revenue/EBIT/D&A to exact hand-verified values with source+asOf", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const y2024 = result.historicals.find((h) => h.fiscalYear === 2024)!;
    expect(y2024.revenue.value).toBe(1400);
    expect(y2024.ebit.value).toBe(280);
    expect(y2024.da.value).toBe(70);
    expect(y2024.revenue.source).toContain("SEC EDGAR");
    expect(y2024.revenue.asOf).toBe("2024-12-31");
  });

  it("derives effective tax rate = tax expense / pretax income", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    for (const year of result.historicals) {
      expect(year.taxRate.value).toBeCloseTo(EXPECTED_TAX_RATE, 10);
    }
  });

  it("derives ΔNWC as the change in modeled NWC level between periods (locked decision)", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    for (const year of result.historicals) {
      expect(year.deltaNWC.value).toBeCloseTo(EXPECTED_DELTA_NWC, 10);
    }
  });

  it("never computes or attaches an EBITDA field — only EBIT and D&A", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    for (const year of result.historicals) {
      expect("ebitda" in year).toBe(false);
    }
  });

  it("attaches full provenance (tag, form, accession, filingDate, periodEnd) for every field", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    expect(result.provenance.length).toBeGreaterThan(0);
    for (const entry of result.provenance) {
      expect(entry.tag).toBeTruthy();
      expect(entry.form).toBeTruthy();
      expect(entry.accessionNumber).toBeTruthy();
      expect(entry.filingDate).toBeTruthy();
      expect(entry.periodEnd).toBeTruthy();
      expect(entry.fiscalYear).toBeGreaterThan(0);
    }
  });
});

describe("mapToFinancials — missing tags never default to 0", () => {
  it("reports insufficient-data when EBIT is entirely missing", () => {
    const facts = buildCompanyFacts({ OperatingIncomeLoss: undefined as never });
    const result = mapToFinancials(facts, 5);
    expect(result.status).toBe("insufficient-data");
    if (result.status === "insufficient-data") {
      expect(result.missingFields.some((f) => f.endsWith(".ebit"))).toBe(true);
    }
  });

  it("reports insufficient-data when there isn't a 6th baseline year for ΔNWC", () => {
    const facts = buildCompanyFacts();
    // Only 3 years of revenue -> can't find yearsWanted+1 endpoints for a 5-year window.
    facts.facts["us-gaap"]!.RevenueFromContractWithCustomerExcludingAssessedTax!.units.USD =
      facts.facts["us-gaap"]!.RevenueFromContractWithCustomerExcludingAssessedTax!.units.USD.slice(-3);
    const result = mapToFinancials(facts, 5);
    expect(result.status).toBe("insufficient-data");
  });

  it("falls back to Depreciation + AmortizationOfIntangibleAssets when the combined D&A tag is absent", () => {
    const facts = buildCompanyFacts({ DepreciationDepletionAndAmortization: undefined as never });
    const usGaap = facts.facts["us-gaap"]!;
    // 2020-2024 depreciation=30, amortization=20 -> composite D&A=50, matching the original fixture's 2020 value.
    usGaap.Depreciation = {
      units: {
        USD: [2020, 2021, 2022, 2023, 2024].map((y) => ({
          start: `${y}-01-01`,
          end: `${y}-12-31`,
          val: 30,
          accn: "accn-dep",
          fy: y + 1,
          fp: "FY",
          form: "10-K",
          filed: `${y + 1}-02-15`,
        })),
      },
    };
    usGaap.AmortizationOfIntangibleAssets = {
      units: {
        USD: [2020, 2021, 2022, 2023, 2024].map((y) => ({
          start: `${y}-01-01`,
          end: `${y}-12-31`,
          val: 20,
          accn: "accn-amort",
          fy: y + 1,
          fp: "FY",
          form: "10-K",
          filed: `${y + 1}-02-15`,
        })),
      },
    };

    const result = mapToFinancials(facts, 5);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      const y2020 = result.historicals.find((h) => h.fiscalYear === 2020)!;
      expect(y2020.da.value).toBe(50);
      expect(y2020.da.source).toContain("composite");
    }
  });

  it("marks taxRate missing (not zero) when pretax income is exactly zero", () => {
    const facts = buildCompanyFacts();
    const usGaap = facts.facts["us-gaap"]!;
    for (const entry of usGaap
      .IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest!
      .units.USD) {
      if (entry.end === "2024-12-31") entry.val = 0;
    }
    const result = mapToFinancials(facts, 5);
    expect(result.status).toBe("insufficient-data");
    if (result.status === "insufficient-data") {
      expect(result.missingFields.some((f) => f.startsWith("2024.taxRate"))).toBe(true);
    }
  });
});
