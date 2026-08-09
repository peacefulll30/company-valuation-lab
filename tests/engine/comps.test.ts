import { describe, expect, it } from "vitest";
import { computeCompanyMultiples, computeComps } from "@/lib/engine/comps";
import type { CompsCompanyInput } from "@/lib/engine/results";

const subject: CompsCompanyInput = {
  ticker: "SUBJ",
  price: 20,
  dilutedShares: 100,
  totalDebt: 100,
  cash: 50,
  revenue: 1000,
  ebitda: 250,
  netIncome: 80,
};

const peerA: CompsCompanyInput = {
  ticker: "PEERA",
  price: 15,
  dilutedShares: 50,
  totalDebt: 30,
  cash: 10,
  revenue: 400,
  ebitda: 100,
  netIncome: 25,
};

// Negative net income -> P/E should be null, not a misleading negative multiple.
const peerB: CompsCompanyInput = {
  ticker: "PEERB",
  price: 40,
  dilutedShares: 20,
  totalDebt: 0,
  cash: 5,
  revenue: 300,
  ebitda: 90,
  netIncome: -10,
};

describe("computeCompanyMultiples", () => {
  it("computes EV, EV/Revenue, EV/EBITDA, and P/E for the subject", () => {
    const multiples = computeCompanyMultiples(subject);
    expect(multiples.enterpriseValue).toBeCloseTo(2050, 8); // 20*100 + 100 - 50
    expect(multiples.evRevenue).toBeCloseTo(2.05, 8);
    expect(multiples.evEbitda).toBeCloseTo(8.2, 8);
    expect(multiples.peRatio).toBeCloseTo(25, 8); // marketCap 2000 / netIncome 80
  });

  it("returns null P/E for negative net income rather than a negative multiple", () => {
    const multiples = computeCompanyMultiples(peerB);
    expect(multiples.peRatio).toBeNull();
  });
});

describe("computeComps", () => {
  const result = computeComps(subject, [peerA, peerB]);

  it("computes multiples for subject and every peer", () => {
    expect(result.subject.ticker).toBe("SUBJ");
    expect(result.peers).toHaveLength(2);
    expect(result.peers[0].evEbitda).toBeCloseTo(7.7, 6); // 770/100
    expect(result.peers[1].evEbitda).toBeCloseTo(795 / 90, 6);
  });

  it("derives an implied per-share range from peer EV/EBITDA applied to subject EBITDA", () => {
    // low multiple 7.7 -> impliedEV=1925, equity=1875 (netDebt 50), price=18.75
    // high multiple 795/90 -> impliedEV=2208.333, equity=2158.333, price=21.5833
    expect(result.impliedRange).not.toBeNull();
    expect(result.impliedRange!.low).toBeCloseTo(18.75, 4);
    expect(result.impliedRange!.high).toBeCloseTo(21.583333333333336, 4);
  });

  it("keeps the comps range structurally separate from any DCF range (no shared field)", () => {
    expect(result).not.toHaveProperty("dcf");
    expect(result).not.toHaveProperty("enterpriseValue");
  });

  it("returns a null implied range when no peer has a usable EV/EBITDA multiple", () => {
    const zeroEbitdaPeer: CompsCompanyInput = { ...peerA, ebitda: 0 };
    const noRangeResult = computeComps(subject, [zeroEbitdaPeer]);
    expect(noRangeResult.impliedRange).toBeNull();
  });
});
