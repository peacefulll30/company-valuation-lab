import { describe, expect, it } from "vitest";
import { buildValuationModelState } from "@/lib/engine";
import { buildAnalystTools, recalculateInputSchema, type RecalculateValuationResult } from "@/lib/ai/tools";
import { sampleAssumptions, sampleCompany } from "@/tests/engine/fixtures";
import { sampleMeta } from "./fixtures";

const executeOptions = { toolCallId: "test-call", messages: [] } as unknown as Parameters<
  ReturnType<typeof buildAnalystTools>["recalculateValuation"]["execute"]
>[1];

// `execute`'s declared type is the generic Tool union (Promise | AsyncIterable
// | plain value) — this implementation always resolves a single Promise, so
// the cast here reflects a known runtime fact about our own function, not an
// assumption about the AI SDK's general tool contract.
async function recalculate(
  overrides: Record<string, number | undefined>,
  financials = sampleCompany
): Promise<RecalculateValuationResult> {
  const tools = buildAnalystTools({ financials, meta: sampleMeta, currentAssumptions: sampleAssumptions });
  const output = await tools.recalculateValuation.execute!(overrides, executeOptions);
  return output as RecalculateValuationResult;
}

describe("recalculateInputSchema", () => {
  it("rejects an empty override object — the model must change at least one assumption", () => {
    expect(recalculateInputSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a single valid override", () => {
    expect(recalculateInputSchema.safeParse({ revenueGrowth: 0.08 }).success).toBe(true);
  });
});

describe("recalculateValuation tool — routes straight into /lib/engine", () => {
  it("computes the override through the real engine, not a shortcut", async () => {
    const result = await recalculate({ revenueGrowth: 0.2 });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");

    const merged = { ...sampleAssumptions, revenueGrowth: 0.2 };
    const expected = buildValuationModelState(sampleCompany, merged);
    expect(result.assumptions).toEqual(merged);
    expect(result.snapshot.dcf.impliedSharePrice).toBe(expected.dcf.impliedSharePrice);
  });

  it("merges the override onto current assumptions, leaving the rest untouched", async () => {
    const result = await recalculate({ wacc: 0.12 });
    if (!result.ok) throw new Error("expected ok result");
    expect(result.assumptions.wacc).toBe(0.12);
    expect(result.assumptions.revenueGrowth).toBe(sampleAssumptions.revenueGrowth);
    expect(result.assumptions.ebitdaMargin).toBe(sampleAssumptions.ebitdaMargin);
    expect(result.assumptions.taxRate).toBe(sampleAssumptions.taxRate);
  });

  it("produces a different result than the baseline when the override actually changes the model", async () => {
    const baseline = buildValuationModelState(sampleCompany, sampleAssumptions);
    const result = await recalculate({ revenueGrowth: 0.35 });
    if (!result.ok) throw new Error("expected ok result");
    expect(result.snapshot.dcf.impliedSharePrice).not.toBe(baseline.dcf.impliedSharePrice);
  });

  it("rejects WACC at or below terminal growth as a structured failure, never a fabricated number", async () => {
    const result = await recalculate({ wacc: 0.02, terminalGrowth: 0.02 });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failure result");
    expect(result.error.toLowerCase()).toContain("terminal growth");
  });

  it("rejects an override that produces invalid diluted shares the same way — a structured failure, not a throw", async () => {
    const zeroSharesCompany = {
      ...sampleCompany,
      historicals: sampleCompany.historicals.map((year) => ({
        ...year,
        dilutedShares: { ...year.dilutedShares, value: 0 },
      })),
    };
    const result = await recalculate({ revenueGrowth: 0.05 }, zeroSharesCompany);
    expect(result.ok).toBe(false);
  });
});
