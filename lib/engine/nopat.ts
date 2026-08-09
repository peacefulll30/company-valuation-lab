/** Locked invariant: `NOPAT = EBIT × (1 − tax rate)` — this exact form, everywhere. */
export function computeNopat(ebit: number, taxRate: number): number {
  return ebit * (1 - taxRate);
}
