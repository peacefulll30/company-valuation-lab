"use client";

import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { formatCurrency } from "@/lib/format";
import { RangeBracket } from "@/components/brand/range-bracket";
import { Reveal } from "@/components/valuation/reveal";
import { FootballFieldChart } from "@/components/charts/football-field-chart";

export function SummaryTab() {
  const { record, modelState, modelError } = useValuationWorkspace();

  if (modelError || !modelState) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">08 — Valuation Summary</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Valuation Summary</h1>
        </div>
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {modelError ?? "Could not compute a valuation summary with the current assumptions."}
        </div>
      </div>
    );
  }

  const { scenarios, dcf } = modelState;
  const prices = [scenarios.bear.impliedSharePrice, scenarios.base.impliedSharePrice, scenarios.bull.impliedSharePrice];
  const low = Math.min(...prices);
  const high = Math.max(...prices);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">08 — Valuation Summary</p>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Where the DCF, scenarios, sensitivity, and trading comps come together into one view of
          what the company is worth.
        </p>
        <p className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {record.meta.ticker} &middot; Base fair value
        </p>
        <p className="mt-1 text-6xl font-semibold tracking-tight text-brand-accent tabular-nums sm:text-7xl">
          {formatCurrency(dcf.impliedSharePrice)}
        </p>
        <RangeBracket width={96} tickHeight={10} className="mt-3 text-brand-accent" />
      </div>

      <Reveal delay={0.1} className="flex flex-col gap-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Base fair value</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(dcf.impliedSharePrice)}</p>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Range (Bear&ndash;Bull)</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatCurrency(low)}&ndash;{formatCurrency(high)}
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Upside / downside vs. price</p>
            <p className="mt-1 text-sm text-muted-foreground">Not available &mdash; current price unavailable</p>
          </div>
        </div>

        <div>
          <FootballFieldChart ranges={[{ label: "DCF", low, base: dcf.impliedSharePrice, high }]} />
          <p className="-mt-6 text-xs text-muted-foreground">
            Comps-implied range and a current-price marker aren&apos;t shown — Trading Comps isn&apos;t
            available yet for this company (see the Trading Comps tab).
          </p>
        </div>
      </Reveal>
    </div>
  );
}
