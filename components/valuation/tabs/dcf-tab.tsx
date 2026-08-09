"use client";

import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { EvEquityWaterfallChart } from "@/components/charts/ev-equity-waterfall-chart";
import { ConceptInfo } from "@/components/valuation/concept-info";
import { DIVERGENCE_THRESHOLD } from "@/lib/engine";

export function DcfTab() {
  const { record, assumptions, waccExplanation, modelState, modelError } = useValuationWorkspace();

  if (modelError || !modelState) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="font-mono text-xs text-muted-foreground">04 — DCF</p>
          <h1 className="mt-1 font-display text-2xl font-medium sm:text-3xl">DCF</h1>
        </div>
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {modelError ?? "Could not compute a DCF with the current assumptions."}
        </div>
      </div>
    );
  }

  const { dcf } = modelState;
  const lastHistoricalYear = record.financials.historicals[record.financials.historicals.length - 1].fiscalYear;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs text-muted-foreground">04 — DCF</p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="font-display text-2xl font-medium sm:text-3xl">DCF</h1>
          <ConceptInfo concept="dcf" />
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          The UFCF bridge from Revenue to unlevered free cash flow, discounted at WACC to a share price.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border bg-card text-left">
              <th className="px-3 py-2 font-medium">$</th>
              {dcf.forecastYears.map((y) => (
                <th key={y.year} className="px-3 py-2 text-right font-mono font-medium">
                  FY{lastHistoricalYear + y.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {(
              [
                ["Revenue", "revenue"],
                ["EBITDA", "ebitda"],
                ["EBIT", "ebit"],
                ["NOPAT", "nopat"],
                ["UFCF", "ufcf"],
              ] as const
            ).map(([label, key]) => (
              <tr key={key} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-muted-foreground">{label}</td>
                {dcf.forecastYears.map((y) => (
                  <td key={y.year} className="px-3 py-2 text-right font-mono">
                    {formatCompactCurrency(y[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EvEquityWaterfallChart
        enterpriseValue={dcf.enterpriseValue}
        netDebt={dcf.netDebt}
        equityValue={dcf.equityValue}
        impliedSharePrice={dcf.impliedSharePrice}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4">
          <p className="font-mono text-xs text-muted-foreground uppercase">Terminal value — perpetuity growth</p>
          <p className="mt-1 font-display text-xl">{formatCompactCurrency(dcf.terminalValue.perpetuity)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Primary / mandatory method.</p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="font-mono text-xs text-muted-foreground uppercase">Terminal value — exit multiple</p>
          <p className="mt-1 font-display text-xl">
            {dcf.terminalValue.exitMultiple !== null ? formatCompactCurrency(dcf.terminalValue.exitMultiple) : "Not provided"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {dcf.terminalValue.exitMultiple === null
              ? "Advanced cross-check — set an exit multiple on Forecast's Advanced panel to compare."
              : dcf.terminalValue.divergenceFlag
                ? `Diverges from the perpetuity method by more than ${formatPercent(DIVERGENCE_THRESHOLD)} — treat with caution.`
                : "Within the expected range of the perpetuity method."}
          </p>
        </div>
      </div>

      <details className="group rounded-md border border-border">
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium select-none">
          <span className="flex items-center gap-1.5">
            Advanced: WACC formula ledger
            {/* Prevent + stop propagation so opening the definition doesn't also toggle the parent <summary> (its native click-to-toggle behavior needs preventDefault, not just stopPropagation). */}
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ConceptInfo concept="wacc" />
            </span>
          </span>
          <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            Advanced
          </span>
        </summary>
        <div className="flex flex-col gap-2 border-t border-border bg-accent/30 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Risk-free rate</span>
            <span
              className="font-mono tabular-nums"
              title={`${waccExplanation.riskFreeRate.source} — as of ${waccExplanation.riskFreeRate.asOf}`}
            >
              {formatPercent(waccExplanation.riskFreeRate.value)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Beta</span>
            <span className="font-mono tabular-nums" title={waccExplanation.beta.source}>
              {waccExplanation.beta.value.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Equity risk premium</span>
            <span className="font-mono tabular-nums" title={waccExplanation.equityRiskPremium.source}>
              {formatPercent(waccExplanation.equityRiskPremium.value)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2 font-medium">
            <span>Cost of equity (used as WACC)</span>
            <span className="font-mono tabular-nums">{formatPercent(waccExplanation.costOfEquity)}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            A full debt-weighted WACC needs the market value of equity (price × diluted shares); current
            price is honestly unavailable this phase, so cost of equity is used directly as the WACC
            proxy. Applied WACC: {formatPercent(assumptions.wacc)}
            {assumptions.wacc !== waccExplanation.costOfEquity ? " (edited from the default on Forecast)" : ""}.
          </p>
        </div>
      </details>
    </div>
  );
}
