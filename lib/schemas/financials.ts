import { z } from "zod";
import { sourcedNumberSchema } from "./sourcedValue";

/**
 * Mirrors `lib/engine/types.ts::FinancialLineItems` exactly (field-for-
 * field) — every numeric field is a required `SourcedValue<number>`, no
 * `.optional()`/`.default()` anywhere. A filing that's missing one of
 * these fails schema validation rather than entering the engine with a
 * silently-zeroed field (CLAUDE.md, PRD §13).
 */
export const financialLineItemsSchema = z.object({
  fiscalYear: z.number().int(),
  revenue: sourcedNumberSchema,
  ebit: sourcedNumberSchema,
  da: sourcedNumberSchema,
  taxRate: sourcedNumberSchema,
  netIncome: sourcedNumberSchema,
  cash: sourcedNumberSchema,
  totalDebt: sourcedNumberSchema,
  dilutedShares: sourcedNumberSchema,
  operatingCashFlow: sourcedNumberSchema,
  capex: sourcedNumberSchema,
  deltaNWC: sourcedNumberSchema,
  // Optional by design — see `FinancialLineItems.cashLikeInvestments` in
  // `/lib/engine/types.ts`. Every other field here is required; this is the
  // one deliberate exception.
  cashLikeInvestments: sourcedNumberSchema.nullable(),
});

/** Mirrors `lib/engine/types.ts::CompanyFinancials` exactly. */
export const companyFinancialsSchema = z.object({
  historicals: z.array(financialLineItemsSchema).min(1),
  currentPrice: sourcedNumberSchema.nullable(),
});

export type FinancialLineItemsInput = z.infer<typeof financialLineItemsSchema>;
export type CompanyFinancialsInput = z.infer<typeof companyFinancialsSchema>;
