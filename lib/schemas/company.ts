import { z } from "zod";
import { companyFinancialsSchema } from "./financials";

/** Mirrors Architecture §7's `CompanyMeta` — company identity, not needed by the engine itself. */
export const companyMetaSchema = z.object({
  ticker: z.string().min(1),
  cik: z.string().min(1),
  name: z.string().min(1),
  sector: z.string().min(1),
  sicCode: z.string().min(1),
  description: z.string(),
  tier: z.enum(["featured", "searched"]),
  peerTickers: z.array(z.string()),
});

/**
 * One committed record per field's provenance (CLAUDE.md §5 — "Preserve
 * provenance for every external value: source, filing/form, filing date,
 * period, as-of date"). Richer than `SourcedValue.source`/`asOf` alone —
 * kept as a sibling of `financials`, not inside it, so the engine-facing
 * `CompanyFinancials` shape stays exactly what `lib/engine/types.ts`
 * expects.
 */
export const fieldProvenanceSchema = z.object({
  field: z.string().min(1),
  fiscalYear: z.number().int(),
  tag: z.string().min(1),
  form: z.string().min(1),
  accessionNumber: z.string().min(1),
  filingDate: z.string().min(1),
  periodEnd: z.string().min(1),
});

/** The shape committed to `/data/featured/{TICKER}.json`. */
export const featuredCompanyRecordSchema = z.object({
  meta: companyMetaSchema,
  financials: companyFinancialsSchema,
  provenance: z.array(fieldProvenanceSchema),
  generatedAt: z.string().min(1),
});

export type CompanyMetaInput = z.infer<typeof companyMetaSchema>;
export type FieldProvenanceInput = z.infer<typeof fieldProvenanceSchema>;
export type FeaturedCompanyRecordInput = z.infer<typeof featuredCompanyRecordSchema>;
