"use client";

import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ScenarioComparisonChart } from "@/components/charts/scenario-comparison-chart";
import { DEFAULT_BEAR_DELTAS, DEFAULT_BULL_DELTAS } from "@/lib/engine";

export function ScenariosTab() {
  const { assumptions, modelState, modelError } = useValuationWorkspace();

  if (modelError || !modelState) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="font-mono text-xs text-muted-foreground">05 — Scenarios</p>
          <h1 className="mt-1 font-display text-2xl font-medium sm:text-3xl">Scenarios</h1>
        </div>
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {modelError ?? "Could not compute scenarios with the current assumptions."}
        </div>
      </div>
    );
  }

  const { scenarios } = modelState;
  const chartData = [
    { label: "Bear" as const, price: scenarios.bear.impliedSharePrice },
    { label: "Base" as const, price: scenarios.base.impliedSharePrice },
    { label: "Bull" as const, price: scenarios.bull.impliedSharePrice },
  ];

  const rows = [
    {
      label: "Revenue growth",
      bear: assumptions.revenueGrowth + DEFAULT_BEAR_DELTAS.revenueGrowth,
      base: assumptions.revenueGrowth,
      bull: assumptions.revenueGrowth + DEFAULT_BULL_DELTAS.revenueGrowth,
    },
    {
      label: "EBITDA margin",
      bear: assumptions.ebitdaMargin + DEFAULT_BEAR_DELTAS.ebitdaMargin,
      base: assumptions.ebitdaMargin,
      bull: assumptions.ebitdaMargin + DEFAULT_BULL_DELTAS.ebitdaMargin,
    },
    {
      label: "Terminal growth",
      bear: assumptions.terminalGrowth + DEFAULT_BEAR_DELTAS.terminalGrowth,
      base: assumptions.terminalGrowth,
      bull: assumptions.terminalGrowth + DEFAULT_BULL_DELTAS.terminalGrowth,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs text-muted-foreground">05 — Scenarios</p>
        <h1 className="mt-1 font-display text-2xl font-medium sm:text-3xl">Scenarios</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Bear, Base, and Bull shown side by side. WACC ({formatPercent(assumptions.wacc)}) is held
          constant across all three — only operating assumptions vary.
        </p>
      </div>

      <ScenarioComparisonChart data={chartData} />

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border bg-card text-left">
              <th className="px-3 py-2 font-medium">Assumption</th>
              <th className="px-3 py-2 text-right font-mono font-medium">Bear</th>
              <th className="px-3 py-2 text-right font-mono font-medium">Base</th>
              <th className="px-3 py-2 text-right font-mono font-medium">Bull</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                <td className="px-3 py-2 text-right font-mono">{formatPercent(row.bear)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatPercent(row.base)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatPercent(row.bull)}</td>
              </tr>
            ))}
            <tr>
              <td className="px-3 py-2 font-medium">Implied share price</td>
              <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(scenarios.bear.impliedSharePrice)}</td>
              <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(scenarios.base.impliedSharePrice)}</td>
              <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(scenarios.bull.impliedSharePrice)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
