"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/format";
import { Reveal } from "@/components/valuation/reveal";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

const localTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function OverviewTab() {
  const { record, modelState } = useValuationWorkspace();
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const [revenueCrosshairX, setRevenueCrosshairX] = useState<number | null>(null);

  // Continuous, non-snapping cursor position (raw pixel, from the native
  // pointer event) — kept deliberately separate from Recharts' own
  // Tooltip/activeDot, which snap to the nearest *real* fiscal-year
  // observation (never an invented in-between value). The line tracks the
  // pointer smoothly; the value shown always belongs to an actual filed
  // year.
  function trackRevenuePointer(event: ReactMouseEvent<SVGElement> | ReactTouchEvent<SVGElement>) {
    const rect = revenueChartRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = "touches" in event ? event.touches[0]?.clientX : event.clientX;
    if (typeof clientX !== "number") return;
    setRevenueCrosshairX(Math.min(Math.max(clientX - rect.left, 0), rect.width));
  }
  const { meta, financials } = record;
  const metrics = modelState?.historicalMetrics ?? [];
  const latest = metrics[metrics.length - 1];
  const latestHistorical = financials.historicals[financials.historicals.length - 1];

  const currentPrice = financials.currentPrice;
  const dilutedShares = latestHistorical.dilutedShares.value;
  const marketCap = currentPrice ? currentPrice.value * dilutedShares : null;
  const fairValue = modelState?.dcf.impliedSharePrice ?? null;
  const upsideDownside = currentPrice && fairValue !== null ? (fairValue - currentPrice.value) / currentPrice.value : null;

  const sparklineData = financials.historicals.map((h) => ({
    year: h.fiscalYear,
    revenue: h.revenue.value,
  }));
  const firstRevenue = sparklineData[0]?.revenue;
  const lastRevenue = sparklineData[sparklineData.length - 1]?.revenue;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">01 — Overview</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{meta.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          A high-level picture of the company and the valuation model — everything on the sections
          below builds toward one number.
        </p>
      </div>

      <Reveal delay={0.1} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Identity</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Ticker</dt>
                <dd className="mt-0.5 font-mono">{meta.ticker}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Sector</dt>
                <dd className="mt-0.5">{meta.sector}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tier</dt>
                <dd className="mt-0.5">
                  <Badge variant="secondary" className="text-[10px] font-medium tracking-wide uppercase">
                    {meta.tier === "featured" ? "Featured" : "Searched"}
                  </Badge>
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">{meta.description}</p>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Key stats</h2>
            <dl className="mt-3 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Revenue (FY{latestHistorical.fiscalYear})</dt>
                <dd
                  className="tabular-nums"
                  title={`${latestHistorical.revenue.source} — as of ${latestHistorical.revenue.asOf}`}
                >
                  {formatCompactCurrency(latestHistorical.revenue.value)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">EBITDA (derived)</dt>
                <dd className="tabular-nums">{latest ? formatCompactCurrency(latest.ebitda) : "—"}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="text-muted-foreground">Latest available price</dt>
                {currentPrice ? (
                  <dd className="tabular-nums" title={`${currentPrice.source} — as of ${localTimeFormatter.format(new Date(currentPrice.asOf))}`}>
                    {formatCurrency(currentPrice.value)}
                  </dd>
                ) : (
                  <dd className="text-xs text-muted-foreground">Unavailable</dd>
                )}
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Market cap</dt>
                <dd className="tabular-nums">{marketCap !== null ? formatCompactCurrency(marketCap) : <span className="text-xs text-muted-foreground">Unavailable (needs price)</span>}</dd>
              </div>
              {currentPrice && fairValue !== null && upsideDownside !== null ? (
                <>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <dt className="text-muted-foreground">DCF fair value (Base)</dt>
                    <dd className="tabular-nums">{formatCurrency(fairValue)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Implied upside / downside</dt>
                    <dd className={upsideDownside >= 0 ? "tabular-nums text-chart-5" : "tabular-nums text-chart-4"}>
                      {upsideDownside >= 0 ? "+" : ""}
                      {formatPercent(upsideDownside)}
                    </dd>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentPrice.source} &middot; as of {localTimeFormatter.format(new Date(currentPrice.asOf))}
                  </p>
                </>
              ) : null}
            </dl>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">
              Revenue, {sparklineData[0]?.year}&ndash;{sparklineData[sparklineData.length - 1]?.year}
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCompactCurrency(firstRevenue)} &rarr; {formatCompactCurrency(lastRevenue)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            A quick gut-check on growth direction — see Historical Financials for the full trend.
          </p>
          <div ref={revenueChartRef} className="relative mt-3 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sparklineData}
                margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                accessibilityLayer
                title={`Revenue by fiscal year, ${sparklineData[0]?.year}–${sparklineData[sparklineData.length - 1]?.year}`}
                desc="Line chart of revenue by fiscal year. Use the arrow keys to move between years; the tooltip shows the exact revenue for each."
                onMouseMove={(_state, event) => trackRevenuePointer(event)}
                onMouseLeave={() => setRevenueCrosshairX(null)}
                onTouchMove={(_state, event) => trackRevenuePointer(event)}
                onTouchEnd={() => setRevenueCrosshairX(null)}
              >
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
                />
                <Tooltip
                  cursor={false}
                  isAnimationActive={false}
                  content={({ active, label, payload }) => {
                    if (!active || !payload?.[0] || typeof payload[0].value !== "number") return null;
                    return (
                      <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-none">
                        <span className="font-mono tabular-nums text-popover-foreground">
                          FY{label} &middot; {formatCompactCurrency(payload[0].value)}
                        </span>
                      </div>
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            {/* Smooth, continuously pointer-tracking guide line — replaces Recharts' own snapped cursor (disabled above via `cursor={false}`) so the indicator itself never jumps between years, even though the tooltip/active dot it accompanies always snaps to a real observation. */}
            {revenueCrosshairX !== null ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-border motion-safe:transition-[left] motion-safe:duration-75 motion-safe:ease-out"
                style={{ left: revenueCrosshairX }}
              />
            ) : null}
          </div>
          <p className="sr-only">
            Revenue by fiscal year: {sparklineData.map((d) => `${d.year}: ${formatCompactCurrency(d.revenue)}`).join(", ")}.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
