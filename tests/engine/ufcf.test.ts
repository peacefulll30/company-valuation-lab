import { describe, expect, it } from "vitest";
import { computeUfcf } from "@/lib/engine/ufcf";

describe("computeUfcf — locked invariant: UFCF = NOPAT + D&A − CapEx − ΔNWC", () => {
  it("computes UFCF for a normal case", () => {
    // 200 + 50 - 50 - 0 = 200
    expect(computeUfcf(200, 50, 50, 0)).toBeCloseTo(200, 10);
  });

  it("computes UFCF for a case with positive ΔNWC drag", () => {
    // 181.5 + 60.5 - 72.6 - 5.5 = 163.9
    expect(computeUfcf(181.5, 60.5, 72.6, 5.5)).toBeCloseTo(163.9, 10);
  });

  it("produces negative UFCF without clamping when NOPAT is deeply negative", () => {
    // -120 + 50 - 50 - 0 = -120
    expect(computeUfcf(-120, 50, 50, 0)).toBeCloseTo(-120, 10);
  });

  it("handles negative ΔNWC (a working-capital release) as a UFCF add-back", () => {
    // 200 + 50 - 50 - (-10) = 210
    expect(computeUfcf(200, 50, 50, -10)).toBeCloseTo(210, 10);
  });
});
