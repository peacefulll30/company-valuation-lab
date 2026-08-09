import { z } from "zod";
import { sourcedNumberSchema } from "./sourcedValue";

/** Mirrors `lib/engine/types.ts::MarginTrajectory` exactly. */
export const marginTrajectorySchema = z.enum(["flat", "ramp", "fade"]);

/** Mirrors `lib/engine/types.ts::WaccComponents` exactly. */
export const waccComponentsSchema = z.object({
  riskFreeRate: sourcedNumberSchema,
  beta: sourcedNumberSchema,
  equityRiskPremium: sourcedNumberSchema,
  preTaxCostOfDebt: sourcedNumberSchema,
  marketValueDebt: z.number().finite(),
  marketValueEquity: z.number().finite(),
});

/** Mirrors `lib/engine/types.ts::AdvancedAssumptions` exactly — every field optional. */
export const advancedAssumptionsSchema = z.object({
  daPctRevenue: z.number().finite().optional(),
  capexPctRevenue: z.number().finite().optional(),
  nwcPctRevenue: z.number().finite().optional(),
  marginTrajectory: marginTrajectorySchema.optional(),
  waccComponents: waccComponentsSchema.optional(),
  exitMultiple: z.number().finite().optional(),
  midYearConvention: z.boolean().optional(),
});

/**
 * Mirrors `lib/engine/types.ts::Assumptions` exactly, with generous sanity
 * bounds on the five scalar fields. These are not the locked WACC > g
 * invariant (that's enforced in `/lib/engine/validate.ts` regardless of
 * this schema) — they're a defensive ceiling/floor at the one boundary
 * that accepts a raw, client-controlled `Assumptions` object
 * (`/api/analyst/chat`), wide enough to comfortably cover every real
 * Featured company's historical range (checked against `/data/featured/*`
 * — e.g. NVDA's ~126% YoY growth year, MCD's ~89% effective tax rate,
 * occasional negative tax rates from credits) while rejecting degenerate
 * inputs like `1e300` that exist only to produce Infinity/NaN downstream.
 */
export const assumptionsSchema = z.object({
  revenueGrowth: z.number().finite().min(-1).max(3),
  ebitdaMargin: z.number().finite().min(-1).max(1),
  taxRate: z.number().finite().min(-1).max(1),
  wacc: z.number().finite().min(0).max(1),
  terminalGrowth: z.number().finite().min(-0.5).max(0.5),
  advanced: advancedAssumptionsSchema.optional(),
});

export type AssumptionsInput = z.infer<typeof assumptionsSchema>;
export type WaccComponentsInput = z.infer<typeof waccComponentsSchema>;
