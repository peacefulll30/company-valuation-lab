import { describe, expect, it } from "vitest";
import {
  collectAnnualFactsByTagPriority,
  collectInstantFactsByTagPriority,
  selectAnnualFacts,
  selectInstantFacts,
} from "@/lib/data/edgar/selectFacts";
import type { XbrlConceptFacts, XbrlFactEntry } from "@/lib/data/edgar/types";

function duration(end: string, start: string, val: number, extra: Partial<XbrlFactEntry> = {}): XbrlFactEntry {
  return { end, start, val, accn: "accn-1", fy: 2024, fp: "FY", form: "10-K", filed: "2024-02-01", ...extra };
}

function instant(end: string, val: number, extra: Partial<XbrlFactEntry> = {}): XbrlFactEntry {
  return { end, val, accn: "accn-1", fy: 2024, fp: "FY", form: "10-K", filed: "2024-02-01", ...extra };
}

describe("selectAnnualFacts", () => {
  it("keeps ~full-year duration entries and drops quarterly/comparative ones", () => {
    const entries = [
      duration("2023-12-31", "2023-01-01", 1000), // full year
      duration("2023-03-31", "2023-01-01", 250), // quarterly
      duration("2023-06-30", "2023-04-01", 260), // quarterly
    ];
    const result = selectAnnualFacts(entries);
    expect(result).toHaveLength(1);
    expect(result[0].val).toBe(1000);
  });

  it("ignores entries from a non-matching form", () => {
    const entries = [duration("2023-12-31", "2023-01-01", 1000, { form: "10-Q" })];
    expect(selectAnnualFacts(entries)).toHaveLength(0);
  });

  it("dedupes duplicate end dates by preferring the most recently filed entry", () => {
    const entries = [
      duration("2023-12-31", "2023-01-01", 1000, { filed: "2024-02-01", accn: "old" }),
      duration("2023-12-31", "2023-01-01", 1005, { filed: "2025-02-01", accn: "restated" }), // later restatement
    ];
    const result = selectAnnualFacts(entries);
    expect(result).toHaveLength(1);
    expect(result[0].val).toBe(1005);
    expect(result[0].accn).toBe("restated");
  });

  it("sorts results by end date descending", () => {
    const entries = [
      duration("2022-12-31", "2022-01-01", 900),
      duration("2023-12-31", "2023-01-01", 1000),
    ];
    const result = selectAnnualFacts(entries);
    expect(result.map((e) => e.end)).toEqual(["2023-12-31", "2022-12-31"]);
  });
});

describe("selectInstantFacts", () => {
  it("keeps only entries without a start date", () => {
    const entries = [
      instant("2023-12-31", 500),
      duration("2023-12-31", "2023-01-01", 1000), // has a start — not instant
    ];
    const result = selectInstantFacts(entries);
    expect(result).toHaveLength(1);
    expect(result[0].val).toBe(500);
  });

  it("dedupes by end date preferring the latest filed entry", () => {
    const entries = [
      instant("2023-12-31", 500, { filed: "2024-01-01" }),
      instant("2023-12-31", 505, { filed: "2024-06-01" }),
    ];
    const result = selectInstantFacts(entries);
    expect(result[0].val).toBe(505);
  });
});

describe("collectAnnualFactsByTagPriority", () => {
  it("uses the first tag with data for an end date, falling back to later tags for gaps", () => {
    const usGaap: Record<string, XbrlConceptFacts> = {
      PrimaryTag: { units: { USD: [duration("2023-12-31", "2023-01-01", 1000)] } },
      FallbackTag: {
        units: {
          USD: [
            duration("2022-12-31", "2022-01-01", 900), // only fallback has 2022
            duration("2023-12-31", "2023-01-01", 999), // primary should win for 2023
          ],
        },
      },
    };
    const result = collectAnnualFactsByTagPriority(usGaap, ["PrimaryTag", "FallbackTag"]);
    expect(result.get("2023-12-31")?.entry.val).toBe(1000);
    expect(result.get("2023-12-31")?.tag).toBe("PrimaryTag");
    expect(result.get("2022-12-31")?.entry.val).toBe(900);
    expect(result.get("2022-12-31")?.tag).toBe("FallbackTag");
  });

  it("returns an empty map when the concept is entirely absent", () => {
    const result = collectAnnualFactsByTagPriority(undefined, ["MissingTag"]);
    expect(result.size).toBe(0);
  });
});

describe("collectInstantFactsByTagPriority", () => {
  it("merges across tags the same way as the annual variant", () => {
    const usGaap: Record<string, XbrlConceptFacts> = {
      CashTagA: { units: { USD: [instant("2023-12-31", 100)] } },
      CashTagB: { units: { USD: [instant("2022-12-31", 90)] } },
    };
    const result = collectInstantFactsByTagPriority(usGaap, ["CashTagA", "CashTagB"]);
    expect(result.get("2023-12-31")?.entry.val).toBe(100);
    expect(result.get("2022-12-31")?.entry.val).toBe(90);
  });
});
