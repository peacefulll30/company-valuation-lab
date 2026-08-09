"use client";

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { buildValuationModelState } from "@/lib/engine";
import type { Assumptions } from "@/lib/engine/types";
import type { ValuationModelState } from "@/lib/engine/results";
import type { CompanyWorkspaceRecord } from "@/lib/data/types";
import type { WaccExplanation } from "@/lib/featured/defaultAssumptions";

type ValuationWorkspaceValue = {
  record: CompanyWorkspaceRecord;
  assumptions: Assumptions;
  setAssumptions: Dispatch<SetStateAction<Assumptions>>;
  resetAssumptions: () => void;
  isDefault: boolean;
  waccExplanation: WaccExplanation;
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
  waccExplanation,
  children,
}: {
  record: CompanyWorkspaceRecord;
  defaultAssumptions: Assumptions;
  waccExplanation: WaccExplanation;
  children: ReactNode;
}) {
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);

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
    resetAssumptions: () => setAssumptions(defaultAssumptions),
    isDefault: assumptions === defaultAssumptions,
    waccExplanation,
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
