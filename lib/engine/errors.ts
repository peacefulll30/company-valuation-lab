/**
 * Engine error taxonomy (Architecture §11). Thrown, not swallowed — a
 * missing/invalid input is a data or assumption error, never silently
 * defaulted to 0 or clamped away (CLAUDE.md, PRD §13).
 */
export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** A required financial field was missing, non-numeric, or non-finite. */
export class MissingRequiredFieldError extends EngineError {
  constructor(public readonly field: string) {
    super(`Missing or invalid required financial field: "${field}".`);
  }
}

/** An assumption (or a derived state) violates a locked invariant, e.g. WACC <= terminal growth. */
export class InvalidAssumptionError extends EngineError {}

/** Diluted shares outstanding was zero, negative, or non-finite. */
export class InvalidSharesError extends EngineError {
  constructor(public readonly dilutedShares: number) {
    super(
      `Diluted shares outstanding must be a positive finite number; received ${dilutedShares}.`
    );
  }
}
