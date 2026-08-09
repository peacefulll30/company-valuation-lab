import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { buildValuationModelState } from "@/lib/engine";
import type { Assumptions, CompanyFinancials } from "@/lib/engine/types";
import type { CompanyMetaInput } from "@/lib/schemas";
import { buildAnalystSnapshot } from "./snapshot";

export const recalculateInputSchema = z
  .object({
    revenueGrowth: z.number().finite().min(-1).max(3).optional().describe("Annual revenue growth as a fraction, e.g. 0.08 for 8%."),
    ebitdaMargin: z.number().finite().min(-1).max(1).optional().describe("EBITDA margin as a fraction of revenue, e.g. 0.32 for 32%."),
    taxRate: z
      .number()
      .finite()
      .min(-1)
      .max(1)
      .optional()
      .describe("Effective tax rate as a fraction, e.g. 0.21 for 21%. Can be negative in a tax-benefit year."),
    wacc: z.number().finite().min(0).max(1).optional().describe("Weighted average cost of capital as a fraction, e.g. 0.09 for 9%."),
    terminalGrowth: z
      .number()
      .finite()
      .min(-0.5)
      .max(0.5)
      .optional()
      .describe("Terminal (perpetuity growth) rate as a fraction, e.g. 0.025 for 2.5%. Must stay below WACC."),
  })
  .refine((overrides) => Object.values(overrides).some((value) => value !== undefined), {
    message: "Provide at least one assumption to override.",
  });

export type RecalculateValuationResult =
  | { ok: true; assumptions: Assumptions; snapshot: ReturnType<typeof buildAnalystSnapshot> }
  | { ok: false; error: string };

/**
 * The one and only numeric tool the AI Analyst may call (Architecture §9,
 * CLAUDE.md). Overrides are merged onto the session's current assumptions
 * and passed straight into `/lib/engine` — the same pure function the UI's
 * own sliders call — so a "what if" answer and a manual assumption edit
 * are computed identically. Invalid combinations (e.g. WACC <= terminal
 * growth) are caught here and reported back as a structured failure, never
 * thrown into the stream or silently coerced into a "close enough" number.
 */
export function buildAnalystTools({
  financials,
  meta,
  currentAssumptions,
}: {
  financials: CompanyFinancials;
  meta: CompanyMetaInput;
  currentAssumptions: Assumptions;
}) {
  return {
    recalculateValuation: tool({
      description:
        "Recalculate the deterministic valuation model with one or more overridden assumptions. Always use this for 'what if' or hypothetical questions instead of estimating the answer yourself — this is the only way a new number can enter the conversation.",
      inputSchema: recalculateInputSchema,
      execute: async (overrides): Promise<RecalculateValuationResult> => {
        const merged: Assumptions = { ...currentAssumptions, ...overrides };
        try {
          const modelState = buildValuationModelState(financials, merged);
          return { ok: true, assumptions: merged, snapshot: buildAnalystSnapshot(modelState, meta) };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not compute a valuation with these assumptions.";
          return { ok: false, error: message };
        }
      },
    }),
  } satisfies ToolSet;
}

export type AnalystTools = ReturnType<typeof buildAnalystTools>;
