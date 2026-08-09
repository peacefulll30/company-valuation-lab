"use client";

import { Badge } from "@/components/ui/badge";
import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { formatCompactCurrency } from "@/lib/format";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export function OverviewTab() {
  const { record, modelState } = useValuationWorkspace();
  const { meta, financials } = record;
  const metrics = modelState?.historicalMetrics ?? [];
  const latest = metrics[metrics.length - 1];
  const latestHistorical = financials.historicals[financials.historicals.length - 1];

  const sparklineData = financials.historicals.map((h) => ({
    year: h.fiscalYear,
    revenue: h.revenue.value,
  }));
  const firstRevenue = sparklineData[0]?.revenue;
  const lastRevenue = sparklineData[sparklineData.length - 1]?.revenue;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs text-muted-foreground">01 — Overview</p>
        <h1 className="mt-1 font-display text-2xl font-medium sm:text-3xl">{meta.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          A high-level picture of the company and the valuation model — everything on the sections
          below builds toward one number.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-medium">Identity</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-mono text-xs text-muted-foreground uppercase">Ticker</dt>
              <dd className="mt-0.5 font-mono">{meta.ticker}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-muted-foreground uppercase">Sector</dt>
              <dd className="mt-0.5">{meta.sector}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-muted-foreground uppercase">Tier</dt>
              <dd className="mt-0.5">
                <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                  {meta.tier === "featured" ? "Featured" : "Searched"}
                </Badge>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">{meta.description}</p>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="text-sm font-medium">Key stats</h2>
          <dl className="mt-3 flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Revenue (FY{latestHistorical.fiscalYear})</dt>
              <dd
                className="font-mono tabular-nums"
                title={`${latestHistorical.revenue.source} — as of ${latestHistorical.revenue.asOf}`}
              >
                {formatCompactCurrency(latestHistorical.revenue.value)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">EBITDA (derived)</dt>
              <dd className="font-mono tabular-nums">
                {latest ? formatCompactCurrency(latest.ebitda) : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="text-muted-foreground">Current price</dt>
              <dd className="font-mono text-xs text-muted-foreground">Unavailable</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Market cap</dt>
              <dd className="font-mono text-xs text-muted-foreground">Unavailable (needs price)</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Revenue, {sparklineData[0]?.year}&ndash;{sparklineData[sparklineData.length - 1]?.year}</h2>
          <p className="font-mono text-xs text-muted-foreground">
            {formatCompactCurrency(firstRevenue)} &rarr; {formatCompactCurrency(lastRevenue)}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          A quick gut-check on growth direction — see Historical Financials for the full trend.
        </p>
        <div className="mt-3 h-16" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="sr-only">
          Revenue by fiscal year: {sparklineData.map((d) => `${d.year}: ${formatCompactCurrency(d.revenue)}`).join(", ")}.
        </p>
      </div>
    </div>
  );
}
