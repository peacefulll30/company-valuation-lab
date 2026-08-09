import { describe, expect, it } from "vitest";
import { deriveEbit, deriveEbitda } from "@/lib/engine/identities";

describe("deriveEbitda / deriveEbit — locked invariant: EBITDA = EBIT + D&A", () => {
  it("derives EBITDA from EBIT and D&A", () => {
    expect(deriveEbitda(200, 50)).toBeCloseTo(250, 10);
  });

  it("derives EBITDA correctly when EBIT is negative", () => {
    expect(deriveEbitda(-100, 50)).toBeCloseTo(-50, 10);
  });

  it("derives EBIT as the inverse of the same identity", () => {
    expect(deriveEbit(250, 50)).toBeCloseTo(200, 10);
  });

  it("round-trips: deriveEbit(deriveEbitda(ebit, da), da) === ebit", () => {
    const ebit = 123.45;
    const da = 67.89;
    expect(deriveEbit(deriveEbitda(ebit, da), da)).toBeCloseTo(ebit, 10);
  });
});
