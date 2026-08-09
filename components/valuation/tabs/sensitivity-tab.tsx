"use client";

import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { ConceptInfo } from "@/components/valuation/concept-info";
import { formatCurrency, formatPercent } from "@/lib/format";

function cellBackground(price: number | null, basePrice: number): string {
  if (price === null) return "repeating-linear-gradient(45deg, var(--muted), var(--muted) 4px, var(--border) 4px, var(--border) 8px)";
  const relDiff = (price - basePrice) / Math.abs(basePrice || 1);
  const magnitude = Math.min(Math.abs(relDiff) / 0.5, 1); // saturate at +-50% from base
  if (Math.abs(relDiff) < 0.01) return "var(--card)";
  const color = relDiff > 0 ? "var(--chart-5)" : "var(--chart-4)";
  const alpha = 0.08 + magnitude * 0.3;
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, var(--card))`;
}

export function SensitivityTab() {
  const { modelState, modelError } = useValuationWorkspace();

  if (modelError || !modelState) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="font-mono text-xs text-muted-foreground">06 — Sensitivity</p>
          <h1 className="mt-1 font-display text-2xl font-medium sm:text-3xl">Sensitivity</h1>
        </div>
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {modelError ?? "Could not compute a sensitivity grid with the current assumptions."}
        </div>
      </div>
    );
  }

  const { sensitivity, dcf, assumptions } = modelState;
  const basePrice = dcf.impliedSharePrice;

  const baseWaccIndex = sensitivity.waccSteps.findIndex((w) => Math.abs(w - assumptions.wacc) < 1e-9);
  const baseGrowthIndex = sensitivity.growthSteps.findIndex((g) => Math.abs(g - assumptions.terminalGrowth) < 1e-9);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs text-muted-foreground">06 — Sensitivity</p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="font-display text-2xl font-medium sm:text-3xl">Sensitivity</h1>
          <ConceptInfo concept="sensitivity" />
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Implied share price across a range of WACC and terminal growth assumptions — a model output
          under stated assumptions, not a price forecast. Cells where growth ≥ WACC are blocked, never
          computed.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Implied share price by WACC (rows) and terminal growth rate (columns). The current Base case
            is ringed.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-mono text-xs text-muted-foreground">
                WACC \ g
              </th>
              {sensitivity.growthSteps.map((g) => (
                <th key={g} scope="col" className="px-3 py-2 text-right font-mono text-xs font-medium">
                  {formatPercent(g)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {sensitivity.waccSteps.map((wacc, i) => (
              <tr key={wacc}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-card px-3 py-2 text-left font-mono text-xs font-medium"
                >
                  {formatPercent(wacc)}
                </th>
                {sensitivity.cells[i].map((price, j) => {
                  const isBase = i === baseWaccIndex && j === baseGrowthIndex;
                  return (
                    <td
                      key={j}
                      tabIndex={0}
                      className="min-w-20 px-3 py-2 text-right font-mono outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      style={{
                        background: cellBackground(price, basePrice),
                        boxShadow: isBase ? "inset 0 0 0 2px var(--brand-accent)" : undefined,
                      }}
                      aria-label={
                        price === null
                          ? `WACC ${formatPercent(wacc)}, growth ${formatPercent(sensitivity.growthSteps[j])}: blocked, growth exceeds WACC`
                          : `WACC ${formatPercent(wacc)}, growth ${formatPercent(sensitivity.growthSteps[j])}: ${formatCurrency(price)}${isBase ? ", base case" : ""}`
                      }
                    >
                      {price === null ? <span aria-hidden="true">&mdash;</span> : formatCurrency(price)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Rows: WACC. Columns: terminal growth rate. The brass-ringed cell is the current Base case.
        Hatched cells are blocked (terminal growth ≥ WACC) and were never computed.
      </p>
    </div>
  );
}
