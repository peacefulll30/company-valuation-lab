import { describe, expect, it } from "vitest";
import { buildValuationModelState } from "@/lib/engine";
import { buildAnalystSnapshot } from "@/lib/ai/snapshot";
import { sampleAssumptions, sampleCompany } from "@/tests/engine/fixtures";
import { sampleMeta } from "./fixtures";

const modelState = buildValuationModelState(sampleCompany, sampleAssumptions);

describe("buildAnalystSnapshot", () => {
  it("reflects the engine's actual DCF output, not a reformulation of it", () => {
    const snapshot = buildAnalystSnapshot(modelState, sampleMeta);
    expect(snapshot.dcf.impliedSharePrice).toBe(modelState.dcf.impliedSharePrice);
    expect(snapshot.dcf.enterpriseValue).toBe(modelState.dcf.enterpriseValue);
    expect(snapshot.dcf.equityValue).toBe(modelState.dcf.equityValue);
    expect(snapshot.dcf.netDebt).toBe(modelState.dcf.netDebt);
  });

  it("carries the assumptions actually used for this computation", () => {
    const snapshot = buildAnalystSnapshot(modelState, sampleMeta);
    expect(snapshot.assumptions).toEqual({
      revenueGrowth: sampleAssumptions.revenueGrowth,
      ebitdaMargin: sampleAssumptions.ebitdaMargin,
      taxRate: sampleAssumptions.taxRate,
      wacc: sampleAssumptions.wacc,
      terminalGrowth: sampleAssumptions.terminalGrowth,
    });
  });

  it("aligns each historical year's metrics with its own filed revenue", () => {
    const snapshot = buildAnalystSnapshot(modelState, sampleMeta);
    expect(snapshot.historicals).toHaveLength(sampleCompany.historicals.length);
    snapshot.historicals.forEach((year, index) => {
      expect(year.fiscalYear).toBe(sampleCompany.historicals[index].fiscalYear);
      expect(year.revenue).toBe(sampleCompany.historicals[index].revenue.value);
    });
  });

  it("carries all three scenario share prices, not just base", () => {
    const snapshot = buildAnalystSnapshot(modelState, sampleMeta);
    expect(snapshot.scenarios.bear.impliedSharePrice).toBe(modelState.scenarios.bear.impliedSharePrice);
    expect(snapshot.scenarios.base.impliedSharePrice).toBe(modelState.scenarios.base.impliedSharePrice);
    expect(snapshot.scenarios.bull.impliedSharePrice).toBe(modelState.scenarios.bull.impliedSharePrice);
  });

  it("is fully JSON-serializable (what actually reaches the model's context)", () => {
    const snapshot = buildAnalystSnapshot(modelState, sampleMeta);
    const roundTripped = JSON.parse(JSON.stringify(snapshot));
    expect(roundTripped).toEqual(snapshot);
  });

  it("reports comps as null rather than fabricating a peer set when none was supplied", () => {
    const snapshot = buildAnalystSnapshot(modelState, sampleMeta);
    expect(snapshot.comps).toBeNull();
  });
});
