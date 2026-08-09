/**
 * The EBITDA = EBIT + D&A identity (CLAUDE.md invariant #3), colocated so
 * both directions of its use — deriving EBITDA from filed EBIT/D&A in
 * historicals.ts, and deriving forecast EBIT from an EBITDA-margin
 * assumption in forecast.ts — share one definition instead of restating it.
 */

export function deriveEbitda(ebit: number, da: number): number {
  return ebit + da;
}

export function deriveEbit(ebitda: number, da: number): number {
  return ebitda - da;
}
