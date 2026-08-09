import { describe, expect, it } from "vitest";
import { checkSicEligibility } from "@/lib/data/edgar/sicEligibility";

describe("checkSicEligibility", () => {
  it.each([
    ["6021", "national commercial bank"],
    ["6099", "depository institution"],
    ["6141", "personal credit institution"],
    ["6211", "security broker/dealer"],
    ["6311", "life insurance"],
    ["6411", "insurance agents/brokers"],
    ["6798", "REIT"],
  ])("blocks SIC %s (%s) as a financial institution", (sic) => {
    const result = checkSicEligibility(sic);
    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toContain(sic);
    }
  });

  it.each([
    ["3571", "electronic computers (AAPL)"],
    ["2086", "bottled soft drinks (KO)"],
    ["5411", "grocery stores (WMT)"],
    ["3523", "farm machinery (CAT)"],
    ["5651", "family clothing stores (NKE)"],
  ])("clears SIC %s (%s) as eligible", (sic) => {
    expect(checkSicEligibility(sic).eligible).toBe(true);
  });

  it("does not block ordinary (non-REIT) real estate operators (6500-6599)", () => {
    expect(checkSicEligibility("6552").eligible).toBe(true);
  });

  it("respects exact range boundaries", () => {
    expect(checkSicEligibility("5999").eligible).toBe(true); // just below the blocked range
    expect(checkSicEligibility("6000").eligible).toBe(false); // start of blocked range
    expect(checkSicEligibility("6099").eligible).toBe(false); // end of blocked range
    expect(checkSicEligibility("6800").eligible).toBe(true); // just above the last blocked range
  });

  it("does not block on an unparseable SIC code (not this layer's job)", () => {
    expect(checkSicEligibility("").eligible).toBe(true);
    expect(checkSicEligibility("N/A").eligible).toBe(true);
  });
});
