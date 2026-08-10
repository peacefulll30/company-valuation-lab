"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "./chart-card";
import { formatCurrency } from "@/lib/format";

export type FootballFieldRange = { label: string; low: number; base: number; high: number };

/**
 * Chart #8 (Design spec §5) — the range-bracket made literal: one
 * horizontal bar per estimate, plus an optional current-price marker.
 * `currentPrice` is independent of which ranges are passed in — it comes
 * straight from the live market-price fetch (see Overview), not from
 * Trading Comps, so it renders whenever a real quote exists even while the
 * comps-implied range stays unavailable (comps aren't built yet — see the
 * Trading Comps tab). Never fabricated: omit the prop entirely rather than
 * pass a guessed value.
 */
export function FootballFieldChart({
  ranges,
  currentPrice,
}: {
  ranges: FootballFieldRange[];
  currentPrice?: number | null;
}) {
  const data = ranges.map((r) => ({ ...r, base_offset: r.low, base_width: r.high - r.low }));

  return (
    <ChartCard
      title="Valuation range"
      question={
        currentPrice
          ? "Where does the DCF range sit relative to today's market price?"
          : "Where does the DCF range sit, high to low?"
      }
      chart={
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
              accessibilityLayer
              title="Valuation range, low to high"
              desc={
                currentPrice
                  ? `Horizontal bar chart showing the DCF-implied valuation range, with a reference line at today's market price of ${formatCurrency(currentPrice)}. Use the arrow keys to move between estimates; the tooltip shows the low, base, and high values.`
                  : "Horizontal bar chart showing the DCF-implied valuation range. Use the arrow keys to move between estimates; the tooltip shows the low, base, and high values."
              }
            >
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tickFormatter={formatCurrency} fontSize={11} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis type="category" dataKey="label" fontSize={12} width={70} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as FootballFieldRange;
                  return (
                    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs">
                      <p className="font-medium text-popover-foreground">{d.label}</p>
                      <p className="mt-0.5 font-mono tabular-nums text-popover-foreground">
                        {formatCurrency(d.low)} &ndash; {formatCurrency(d.high)} (base {formatCurrency(d.base)})
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="base_offset" stackId="ff" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="base_width" stackId="ff" fill="var(--chart-1)" radius={[3, 3, 3, 3]} isAnimationActive={false} />
              {currentPrice ? (
                <ReferenceLine
                  x={currentPrice}
                  ifOverflow="extendDomain"
                  stroke="var(--foreground)"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Market ${formatCurrency(currentPrice)}`,
                    position: "insideTopRight",
                    fill: "var(--foreground)",
                    fontSize: 11,
                  }}
                />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-normal">Estimate</th>
              <th className="py-1.5 font-normal">Low</th>
              <th className="py-1.5 font-normal">Base</th>
              <th className="py-1.5 font-normal">High</th>
            </tr>
          </thead>
          <tbody>
            {ranges.map((r) => (
              <tr key={r.label} className="border-b border-border last:border-0">
                <td className="py-1.5">{r.label}</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCurrency(r.low)}</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCurrency(r.base)}</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCurrency(r.high)}</td>
              </tr>
            ))}
            {currentPrice ? (
              <tr className="border-b border-border last:border-0">
                <td className="py-1.5">Market price</td>
                <td className="py-1.5 font-mono tabular-nums text-muted-foreground">&mdash;</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCurrency(currentPrice)}</td>
                <td className="py-1.5 font-mono tabular-nums text-muted-foreground">&mdash;</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      }
    />
  );
}
