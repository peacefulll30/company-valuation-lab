/** Locked invariant: `UFCF = NOPAT + D&A − CapEx − ΔNWC` — this exact form, everywhere. */
export function computeUfcf(nopat: number, da: number, capex: number, deltaNWC: number): number {
  return nopat + da - capex - deltaNWC;
}
