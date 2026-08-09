import type { CompanyFinancialsInput, CompanyMetaInput, FieldProvenanceInput } from "@/lib/schemas";

/**
 * The discriminated union every company lookup resolves to (Phase 3 brief
 * item 6; extended Phase 5) — success, unsupported (bank/insurer/
 * incompatible), insufficient-data, not-found, or network-error (SEC EDGAR
 * itself was unreachable — distinct from insufficient-data, which means we
 * reached EDGAR but the retrieved data was incomplete/unreliable). Never
 * blended, never a partial `CompanyFinancials` (CLAUDE.md — "Unsupported /
 * data-unavailable behavior").
 */
export type CompanyResolutionResult =
  | {
      status: "success";
      meta: CompanyMetaInput;
      financials: CompanyFinancialsInput;
      provenance: FieldProvenanceInput[];
    }
  | { status: "unsupported"; reason: string; sicCode?: string }
  | { status: "insufficient-data"; reason: string; missingFields?: string[] }
  | { status: "not-found"; reason: string }
  | { status: "network-error"; reason: string };

/** The shape every UI screen reads a company from — Featured (static JSON) or a live Search result alike. */
export type CompanyWorkspaceRecord = {
  meta: CompanyMetaInput;
  financials: CompanyFinancialsInput;
  provenance: FieldProvenanceInput[];
  generatedAt: string;
};

/** Builds the UI-facing record from a successful resolution — the one place that does this, reused by the offline Featured pipeline and the live Search path alike. */
export function toCompanyWorkspaceRecord(
  result: Extract<CompanyResolutionResult, { status: "success" }>
): CompanyWorkspaceRecord {
  return {
    meta: result.meta,
    financials: result.financials,
    provenance: result.provenance,
    generatedAt: new Date().toISOString(),
  };
}
