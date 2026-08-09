import type { TerminalValueResult } from "./results";
import { assertWaccExceedsGrowth } from "./validate";

/**
 * A material divergence between the two terminal-value methods gets
 * flagged rather than silently resolved (PRD FR-24). 20% relative
 * difference is a locked Phase 2 decision (not derived from a PRD/
 * Architecture number) — centralized here as the single source of truth so
 * no other module restates it, and exposed as an optional parameter on
 * `computeTerminalValue` for callers that need a different bar without
 * duplicating the constant.
 */
export const DIVERGENCE_THRESHOLD = 0.2;

/** Perpetuity growth terminal value: `TV = UFCF_(n+1) / (WACC − g)` — the primary/mandatory method. */
export function computePerpetuityTerminalValue(
  finalYearUfcf: number,
  wacc: number,
  terminalGrowth: number
): number {
  assertWaccExceedsGrowth(wacc, terminalGrowth);
  const nextYearUfcf = finalYearUfcf * (1 + terminalGrowth);
  return nextYearUfcf / (wacc - terminalGrowth);
}

/** Exit multiple terminal value: `TV = Terminal Year EBITDA × Exit Multiple` — an Advanced cross-check. */
export function computeExitMultipleTerminalValue(
  terminalYearEbitda: number,
  exitMultiple: number
): number {
  return terminalYearEbitda * exitMultiple;
}

function isMaterialDivergence(
  perpetuity: number,
  exitMultiple: number,
  threshold: number
): boolean {
  const magnitude = Math.max(Math.abs(perpetuity), Math.abs(exitMultiple));
  if (magnitude === 0) return false;
  return Math.abs(perpetuity - exitMultiple) / magnitude > threshold;
}

/**
 * Computes both terminal value methods (exit multiple only when supplied,
 * per its Advanced/optional status) and flags material divergence against
 * `divergenceThreshold` (defaults to the locked `DIVERGENCE_THRESHOLD`).
 */
export function computeTerminalValue(
  finalYearUfcf: number,
  terminalYearEbitda: number,
  wacc: number,
  terminalGrowth: number,
  exitMultiple?: number,
  divergenceThreshold: number = DIVERGENCE_THRESHOLD
): TerminalValueResult {
  const perpetuity = computePerpetuityTerminalValue(finalYearUfcf, wacc, terminalGrowth);
  const exitMultipleValue =
    exitMultiple !== undefined
      ? computeExitMultipleTerminalValue(terminalYearEbitda, exitMultiple)
      : null;

  return {
    perpetuity,
    exitMultiple: exitMultipleValue,
    divergenceFlag:
      exitMultipleValue !== null
        ? isMaterialDivergence(perpetuity, exitMultipleValue, divergenceThreshold)
        : false,
  };
}
