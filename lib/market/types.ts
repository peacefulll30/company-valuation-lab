/**
 * Live market price — deliberately separate from `/lib/engine`'s
 * `SourcedValue` (CLAUDE.md: engine stays pure, no I/O, no `Date.now()`).
 * `asOf` here is a real wall-clock timestamp (when *we* fetched it, not
 * necessarily the exchange's own tick time) — honest about being "as of
 * our last successful check," never presented as more precise than that.
 */
export type MarketQuote = {
  price: number;
  currency: string;
  /** When *we* last successfully checked (ISO datetime) — always present. */
  asOf: string;
  /** The provider's own quote timestamp (ISO datetime), when it supplies one distinct from our fetch time. `null` if the provider's response didn't include a usable one — the UI falls back to `asOf` rather than guessing. */
  providerTimestamp: string | null;
  source: string;
  /**
   * Twelve Data's free tier is end-of-day/delayed, not a real-time feed —
   * this is always "latest available price" today. Kept as an explicit
   * field (not a hardcoded UI string) so the label can never silently
   * drift to implying real-time if that ever changes.
   */
  isRealTime: boolean;
};

export type MarketQuoteResult = { status: "ok"; quote: MarketQuote } | { status: "unavailable"; reason: string };
