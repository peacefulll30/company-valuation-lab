"use client";

import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { ConceptInfo } from "@/components/valuation/concept-info";
import { Reveal } from "@/components/valuation/reveal";

export function CompsTab() {
  const { record } = useValuationWorkspace();
  const hasPrice = record.financials.currentPrice !== null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">07 — Trading Comps</p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Trading Comps</h1>
          <ConceptInfo concept="comps" />
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          How {record.meta.ticker}&apos;s trading multiples compare to a peer set.
        </p>
      </div>

      <Reveal delay={0.1}>
        <div className="rounded-md border border-dashed border-border bg-card p-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Not yet available for this company
          </p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Trading multiples (EV/Revenue, EV/EBITDA, P/E) are built on market price — for {record.meta.ticker}
            and every peer. {hasPrice ? `${record.meta.ticker}'s current price is available (see Overview), but a` : "Current price is unavailable (see Overview), and a"}{" "}
            hand-curated peer set for {record.meta.ticker} hasn&apos;t been assembled yet. Rather than compute
            a multiple from a missing or fabricated price, this section stays empty until both are in place.
          </p>
          <ul className="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-brand-accent">
                &ndash;
              </span>
              A hand-curated 3&ndash;5 company peer set for {record.meta.ticker}
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className={hasPrice ? "text-muted-foreground line-through" : "text-brand-accent"}>
                &ndash;
              </span>
              A reliable current-price source for the subject and every peer{hasPrice ? " (subject price now available)" : ""}
            </li>
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
