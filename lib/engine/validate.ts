import { InvalidAssumptionError, InvalidSharesError, MissingRequiredFieldError } from "./errors";
import type { SourcedValue } from "./types";

/**
 * The single implementation of every engine invariant guard (Architecture
 * §8 — "one implementation of every invariant, not two"). Every other
 * module imports these rather than re-checking a rule inline.
 */

/** WACC > terminal growth, enforced everywhere the perpetuity formula is used (locked invariant). */
export function assertWaccExceedsGrowth(wacc: number, terminalGrowth: number): void {
  if (!(wacc > terminalGrowth)) {
    throw new InvalidAssumptionError(
      `WACC (${wacc}) must exceed the terminal growth rate (${terminalGrowth}).`
    );
  }
}

/** Diluted shares must be a positive, finite number before any division by it. */
export function assertValidDilutedShares(dilutedShares: number): void {
  if (!(Number.isFinite(dilutedShares) && dilutedShares > 0)) {
    throw new InvalidSharesError(dilutedShares);
  }
}

/**
 * Unwraps a required SourcedValue, throwing rather than defaulting to 0 if
 * it is missing or not a finite number (CLAUDE.md — "never default a
 * missing required financial field to 0").
 */
export function requireSourcedNumber(field: string, sourced: SourcedValue<number> | null | undefined): number {
  const value = sourced?.value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MissingRequiredFieldError(field);
  }
  return value;
}

/** Same guard for a plain (already-unwrapped) required numeric input. */
export function requireFiniteNumber(field: string, value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MissingRequiredFieldError(field);
  }
  return value;
}
