import { z } from "zod";
import { sourcedNumberSchema } from "@/lib/schemas";
import marketAssumptionsJson from "@/data/market-assumptions.json";

/**
 * Small, manually curated macro-assumption defaults (Architecture §10 —
 * "deliberately not a second live integration"). `riskFreeRate` is a real,
 * dated 10-Year Treasury yield fetched at build time from Treasury.gov;
 * `equityRiskPremium`, `costOfDebtSpread`, `defaultTerminalGrowth`, and
 * `defaultBeta` are documented illustrative defaults, not live data — each
 * says so plainly in its own `source` string (CLAUDE.md — never render an
 * externally sourced number without source + as-of; never pretend an
 * illustrative default is live).
 */
const marketAssumptionsSchema = z.object({
  riskFreeRate: sourcedNumberSchema,
  equityRiskPremium: sourcedNumberSchema,
  costOfDebtSpread: sourcedNumberSchema,
  defaultTerminalGrowth: sourcedNumberSchema,
  defaultBeta: sourcedNumberSchema,
});

export type MarketAssumptions = z.infer<typeof marketAssumptionsSchema>;

export const marketAssumptions: MarketAssumptions = marketAssumptionsSchema.parse(marketAssumptionsJson);
