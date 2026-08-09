"use client";

import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { RevenueEbitdaChart } from "@/components/charts/revenue-ebitda-chart";
import { MarginTrendChart } from "@/components/charts/margin-trend-chart";
import { FcfChart } from "@/components/charts/fcf-chart";
import { ConceptInfo } from "@/components/valuation/concept-info";
import { Reveal } from "@/components/valuation/reveal";
import type { FinancialLineItems } from "@/lib/engine/types";

function SourcedCell({ value, item }: { value: number; item: { source: string; asOf: string } }) {
  return (
    <span
      tabIndex={0}
      title={`${item.source} — as of ${item.asOf}`}
      aria-label={`${value.toLocaleString()}. Source: ${item.source}, as of ${item.asOf}.`}
      className="cursor-help underline decoration-muted-foreground/40 decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
    >
      {formatCompactCurrency(value)}
    </span>
  );
}

const ROWS: { key: keyof FinancialLineItems; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "ebit", label: "EBIT" },
  { key: "da", label: "D&A" },
  { key: "netIncome", label: "Net income" },
  { key: "operatingCashFlow", label: "Operating cash flow" },
  { key: "capex", label: "CapEx" },
  { key: "deltaNWC", label: "ΔNWC" },
  { key: "cash", label: "Cash" },
  { key: "totalDebt", label: "Total debt" },
];

export function HistoricalsTab() {
  const { record, modelState, modelError } = useValuationWorkspace();
  const { historicals } = record.financials;

  // Historical figures themselves never depend on the current assumptions,
  // but the *derived* metrics (EBITDA, margins, FCF) come from the shared
  // `modelState`, which goes null the moment any assumption elsewhere is
  // invalid (e.g. WACC <= terminal growth on Forecast). Without this guard,
  // the charts below would silently fall back to fabricated `0`s instead of
  // the same calm error state every other data-driven tab shows.
  if (modelError || !modelState) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">02 — Historical Financials</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Historical Financials</h1>
        </div>
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {modelError ?? "Could not compute derived historical metrics with the current assumptions."}
        </div>
      </div>
    );
  }

  const metrics = modelState.historicalMetrics;

  const revenueEbitdaData = historicals.map((h, i) => ({
    year: h.fiscalYear,
    revenue: h.revenue.value,
    ebitda: metrics[i].ebitda,
  }));
  const marginData = historicals.map((h, i) => ({
    year: h.fiscalYear,
    ebitdaMargin: metrics[i].ebitdaMargin,
    ebitMargin: metrics[i].ebitMargin,
    netMargin: metrics[i].netMargin,
  }));
  const fcfData = historicals.map((h, i) => ({
    year: h.fiscalYear,
    freeCashFlow: metrics[i].freeCashFlow,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">02 — Historical Financials</p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Historical Financials</h1>
          <ConceptInfo concept="historicals" />
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Five years of filed financials, sourced and dated. Focus or hover any figure to see its filing
          source.
        </p>
      </div>

      <Reveal delay={0.1} className="flex flex-col gap-8">
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left">
                <th className="px-3 py-2 font-medium">Line item</th>
                {historicals.map((h) => (
                  <th key={h.fiscalYear} className="px-3 py-2 text-right font-mono font-medium">
                    FY{h.fiscalYear}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {ROWS.map((row) => (
                <tr key={row.key} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                  {historicals.map((h) => {
                    const item = h[row.key] as { value: number; source: string; asOf: string };
                    return (
                      <td key={h.fiscalYear} className="px-3 py-2 text-right">
                        <SourcedCell value={item.value} item={item} />
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-b border-border bg-accent/40 last:border-0">
                <td className="px-3 py-2 font-medium">
                  EBITDA{" "}
                  <span className="ml-1 rounded-sm bg-muted px-1 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    derived
                  </span>
                </td>
                {metrics.map((m) => (
                  <td key={m.fiscalYear} className="px-3 py-2 text-right font-medium">
                    {formatCompactCurrency(m.ebitda)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-muted-foreground">Revenue growth</td>
                {metrics.map((m) => (
                  <td key={m.fiscalYear} className="px-3 py-2 text-right">
                    {m.revenueGrowth !== null ? formatPercent(m.revenueGrowth) : "—"}
                  </td>
                ))}
              </tr>
              <tr className="last:border-0">
                <td className="px-3 py-2 text-muted-foreground">EBITDA margin</td>
                {metrics.map((m) => (
                  <td key={m.fiscalYear} className="px-3 py-2 text-right">
                    {m.ebitdaMargin !== null ? formatPercent(m.ebitdaMargin) : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <RevenueEbitdaChart data={revenueEbitdaData} />
          <MarginTrendChart data={marginData} />
          <FcfChart data={fcfData} />
        </div>
      </Reveal>
    </div>
  );
}
