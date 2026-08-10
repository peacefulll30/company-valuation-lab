"use client";

import { useCallback, useRef, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { MarketQuote, MarketQuoteResult } from "@/lib/market/types";

type State =
  | { phase: "ready"; quote: MarketQuote }
  | { phase: "stale"; quote: MarketQuote; reason: string }
  | { phase: "unavailable"; reason: string };

const localTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function toState(result: MarketQuoteResult, previous: MarketQuote | null): State {
  if (result.status === "ok") return { phase: "ready", quote: result.quote };
  if (previous) return { phase: "stale", quote: previous, reason: result.reason };
  return { phase: "unavailable", reason: result.reason };
}

/**
 * Compact live-price display (brief §1/§4) — server-rendered on first
 * paint from `initial` (the layout's own `fetchQuote` call, already
 * ISR-cached — see `lib/market/twelveData.ts`), so there's no loading
 * flash for the common case. The Refresh button re-checks via
 * `/api/market/quote`, our own rate-limited proxy (the Twelve Data key
 * never reaches the browser). A failed refresh keeps showing the last
 * known-good quote, marked "stale" rather than blanking it — and never
 * touches the DCF: this component only ever reads/displays, nothing here
 * feeds back into a calculation path.
 */
export function PricePanel({
  ticker,
  initial,
  onQuoteChange,
}: {
  ticker: string;
  initial: MarketQuoteResult;
  /** Called only after a *successful* refresh (never on "unavailable" — a failed refresh must never feed a stale/missing price anywhere downstream, including WACC). */
  onQuoteChange?: (quote: MarketQuote) => void;
}) {
  const [state, setState] = useState<State>(() => toState(initial, initial.status === "ok" ? initial.quote : null));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastGoodQuote = useRef<MarketQuote | null>(initial.status === "ok" ? initial.quote : null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/market/quote?ticker=${encodeURIComponent(ticker)}`);
      const result: MarketQuoteResult = await response.json();
      if (result.status === "ok") {
        lastGoodQuote.current = result.quote;
        onQuoteChange?.(result.quote);
      }
      setState(toState(result, lastGoodQuote.current));
    } catch {
      setState(toState({ status: "unavailable", reason: "Couldn't reach the market data service." }, lastGoodQuote.current));
    } finally {
      setIsRefreshing(false);
    }
  }, [ticker, onQuoteChange]);

  if (state.phase === "unavailable") {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Price unavailable</span>
        <RefreshButton onClick={refresh} isRefreshing={isRefreshing} />
      </div>
    );
  }

  const { quote } = state;
  const displayTimestamp = quote.providerTimestamp ?? quote.asOf;

  return (
    <div role="status" aria-live="polite" className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-semibold tabular-nums">{formatCurrency(quote.price)}</span>
        <span className="text-xs text-muted-foreground">{quote.currency}</span>
        {state.phase === "stale" ? <span className="text-[11px] text-muted-foreground">(stale)</span> : null}
      </div>
      <span className="text-[11px] text-muted-foreground">
        {quote.isRealTime ? "Real-time" : "Latest available price"} &middot; {quote.source} &middot; provider time{" "}
        {localTimeFormatter.format(new Date(displayTimestamp))} &middot; checked {localTimeFormatter.format(new Date(quote.asOf))}{" "}
        your time
      </span>
      <RefreshButton onClick={refresh} isRefreshing={isRefreshing} />
    </div>
  );
}

function RefreshButton({ onClick, isRefreshing }: { onClick: () => void; isRefreshing: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isRefreshing}
      aria-label="Refresh price"
      className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      {isRefreshing ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="size-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
