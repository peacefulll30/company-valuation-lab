import { z } from "zod";

/**
 * Zod counterpart of `lib/engine/types.ts`'s `SourcedValue<T>` — every
 * externally sourced number carries where it came from and when
 * (CLAUDE.md, no exceptions). `value` is required and must be finite:
 * a missing/NaN value fails validation rather than silently becoming 0
 * (CLAUDE.md — "never default a missing required financial field to 0").
 */
export function sourcedValueSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema,
    source: z.string().min(1),
    asOf: z.string().min(1), // ISO date
  });
}

export const sourcedNumberSchema = sourcedValueSchema(z.number().finite());
