"use client";

import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { buildValuationModelState } from "@/lib/engine";
import type { Assumptions } from "@/lib/engine/types";
import type { ValuationModelState } from "@/lib/engine/results";
import type { CompanyWorkspaceRecord } from "@/lib/data/types";
import type { TaxRateExplanation, WaccExplanation } from "@/lib/featured/defaultAssumptions";
import { applyPriceRefreshToWacc, type WaccMode } from "@/lib/featured/waccMode";
import type { MarketQuote, MarketQuoteResult } from "@/lib/market/types";

export type { WaccMode } from "@/lib/featured/waccMode";

type ValuationWorkspaceValue = {
  record: CompanyWorkspaceRecord;
  assumptions: Assumptions;
  setAssumptions: Dispatch<SetStateAction<Assumptions>>;
  resetAssumptions: () => void;
  isDefault: boolean;
  waccExplanation: WaccExplanation;
  /** AUTO (derived — from a live price, or the CAPM proxy without one) vs MANUAL (the user typed their own WACC on Forecast; a price refresh must never overwrite it). */
  waccMode: WaccMode;
  /** Records a user-typed WACC and switches to MANUAL — from this point a price refresh leaves it alone until `resetAssumptions`. */
  setManualWacc: (value: number) => void;
  /** Called after a successful price refresh. In AUTO mode, recomputes the Estimated WACC from the fresh price; in MANUAL mode, it's a deliberate no-op. */
  updateWaccFromPrice: (quote: MarketQuote) => void;
  taxRateExplanation: TaxRateExplanation;
  /** The layout's own server-side `fetchQuote` result — richer than `record.financials.currentPrice` (adds currency/provider timestamp/real-time flag) for the live `PricePanel` display; the plain engine-facing `SourcedValue` stays on `record.financials` for calculations. */
  initialQuote: MarketQuoteResult;
  /** `null` when the current assumptions violate a locked invariant (see `modelError`). */
  modelState: ValuationModelState | null;
  /** Set when e.g. WACC <= terminal growth — the UI blocks with this message rather than computing. */
  modelError: string | null;
};

const ValuationWorkspaceContext = createContext<ValuationWorkspaceValue | null>(null);

/**
 * Owns the live `Assumptions` for one company's workspace and recomputes
 * the full `ValuationModelState` (client-side, via the pure engine — no
 * route handler needed) on every change, so every tab and the sidebar's
 * persistent Fair Value stat stay in sync (Design spec §3). Seeded from a
 * server-computed default so the first paint is already correct.
 */
export function ValuationWorkspaceProvider({
  record,
  defaultAssumptions,
  waccExplanation: defaultWaccExplanation,
  taxRateExplanation,
  initialQuote,
  children,
}: {
  record: CompanyWorkspaceRecord;
  defaultAssumptions: Assumptions;
  waccExplanation: WaccExplanation;
  taxRateExplanation: TaxRateExplanation;
  initialQuote: MarketQuoteResult;
  children: ReactNode;
}) {
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const [waccExplanation, setWaccExplanation] = useState<WaccExplanation>(defaultWaccExplanation);
  // Starts AUTO regardless of whether the initial server-computed default
  // was itself a weighted estimate or the no-price CAPM proxy — both are
  // "derived," not user-typed. Only an actual edit on Forecast flips this.
  const [waccMode, setWaccMode] = useState<WaccMode>("auto");

  const setManualWacc = useCallback((value: number) => {
    setWaccMode("manual");
    setAssumptions((prev) => ({ ...prev, wacc: value }));
  }, []);

  const updateWaccFromPrice = useCallback(
    (quote: MarketQuote) => {
      const result = applyPriceRefreshToWacc(record.financials, waccMode, quote);
      if (!result) return; // MANUAL — a price refresh never overwrites a user-typed WACC.
      setAssumptions((prev) => ({ ...prev, wacc: result.wacc }));
      setWaccExplanation(result.waccExplanation);
    },
    [waccMode, record.financials]
  );

  const resetAssumptions = useCallback(() => {
    setAssumptions(defaultAssumptions);
    setWaccExplanation(defaultWaccExplanation);
    setWaccMode("auto");
  }, [defaultAssumptions, defaultWaccExplanation]);

  const { modelState, modelError } = useMemo(() => {
    try {
      return { modelState: buildValuationModelState(record.financials, assumptions), modelError: null };
    } catch (error) {
      return {
        modelState: null,
        modelError: error instanceof Error ? error.message : "Could not compute a valuation with these assumptions.",
      };
    }
  }, [record, assumptions]);

  const value: ValuationWorkspaceValue = {
    record,
    assumptions,
    setAssumptions,
    resetAssumptions,
    isDefault: assumptions === defaultAssumptions,
    waccExplanation,
    waccMode,
    setManualWacc,
    updateWaccFromPrice,
    taxRateExplanation,
    initialQuote,
    modelState,
    modelError,
  };

  return (
    <ValuationWorkspaceContext.Provider value={value}>{children}</ValuationWorkspaceContext.Provider>
  );
}

export function useValuationWorkspace(): ValuationWorkspaceValue {
  const ctx = useContext(ValuationWorkspaceContext);
  if (!ctx) {
    throw new Error("useValuationWorkspace must be used within a ValuationWorkspaceProvider");
  }
  return ctx;
}
