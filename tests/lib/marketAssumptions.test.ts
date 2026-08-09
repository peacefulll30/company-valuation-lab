import { describe, expect, it } from "vitest";
import { marketAssumptions } from "@/lib/market-assumptions";

describe("marketAssumptions", () => {
  it("every value has a non-empty source and asOf date (CLAUDE.md — no exceptions)", () => {
    for (const entry of Object.values(marketAssumptions)) {
      expect(typeof entry.value).toBe("number");
      expect(Number.isFinite(entry.value)).toBe(true);
      expect(entry.source.length).toBeGreaterThan(0);
      expect(entry.asOf.length).toBeGreaterThan(0);
    }
  });

  it("illustrative (non-live) defaults say so plainly in their own source string", () => {
    expect(marketAssumptions.equityRiskPremium.source.toLowerCase()).toContain("not a live feed");
    expect(marketAssumptions.costOfDebtSpread.source.toLowerCase()).toContain("not a live feed");
    expect(marketAssumptions.defaultTerminalGrowth.source.toLowerCase()).toContain("not a live feed");
    expect(marketAssumptions.defaultBeta.source.toLowerCase()).toContain("no per-company beta");
  });

  it("riskFreeRate is a plausible fraction, not a whole-number percent", () => {
    expect(marketAssumptions.riskFreeRate.value).toBeGreaterThan(0);
    expect(marketAssumptions.riskFreeRate.value).toBeLessThan(0.25);
  });
});
