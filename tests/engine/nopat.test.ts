import { describe, expect, it } from "vitest";
import { computeNopat } from "@/lib/engine/nopat";

describe("computeNopat — locked invariant: NOPAT = EBIT × (1 − tax rate)", () => {
  it("computes NOPAT for a normal positive-EBIT case", () => {
    expect(computeNopat(1000, 0.25)).toBeCloseTo(750, 10);
  });

  it("computes NOPAT for negative EBIT without clamping to zero", () => {
    // The locked formula has no carve-out for negative EBIT — apply it literally.
    expect(computeNopat(-200, 0.25)).toBeCloseTo(-150, 10);
  });

  it("handles a zero tax rate", () => {
    expect(computeNopat(500, 0)).toBeCloseTo(500, 10);
  });
});
