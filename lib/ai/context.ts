import { buildValuationModelState } from "@/lib/engine";
import type { Assumptions } from "@/lib/engine/types";
import { resolveWorkspaceCompany } from "@/lib/data/workspaceCompany";
import { buildAnalystSnapshot } from "./snapshot";
import { buildAnalystSystemPrompt } from "./systemPrompt";
import { buildAnalystTools, type AnalystTools } from "./tools";

export type AnalystContextResult = { ok: true; system: string; tools: AnalystTools } | { ok: false; status: number; message: string };

/**
 * The trusted, deterministic half of the AI Analyst request (Architecture
 * §9): resolves the company the same way the workspace layout does, then
 * re-derives `ValuationModelState` from the *inputs* the client sent
 * (assumption values only, never a pre-computed result) via the same pure
 * engine every other tab uses. Kept separate from the `streamText` call so
 * it can be exercised directly in tests without touching the AI SDK or a
 * network call — this is the part that actually decides what the model is
 * grounded in.
 */
export async function buildAnalystContext(companySlug: string, assumptions: Assumptions): Promise<AnalystContextResult> {
  const resolution = await resolveWorkspaceCompany(companySlug);
  if ("error" in resolution) {
    return { ok: false, status: 422, message: `Can't ground the analyst — ${resolution.error.reason}` };
  }
  const { record } = resolution;

  let modelState;
  try {
    modelState = buildValuationModelState(record.financials, assumptions);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "These assumptions don't produce a valid valuation.";
    return { ok: false, status: 422, message: `Can't ground the analyst in the current assumptions — ${reason}` };
  }

  const snapshot = buildAnalystSnapshot(modelState, record.meta);
  return {
    ok: true,
    system: buildAnalystSystemPrompt(snapshot),
    tools: buildAnalystTools({ financials: record.financials, meta: record.meta, currentAssumptions: assumptions }),
  };
}
