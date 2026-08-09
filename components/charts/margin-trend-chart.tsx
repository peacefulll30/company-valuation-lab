"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "./chart-card";
import { ChartTooltipContent } from "./chart-tooltip";
import { formatPercent } from "@/lib/format";

export type MarginPoint = { year: number; ebitdaMargin: number | null; ebitMargin: number | null; netMargin: number | null };

/** Chart #2 (Design spec §5) — 3-line, categorical slots 1-3. Answers: is profitability improving or eroding? */
export function MarginTrendChart({ data }: { data: MarginPoint[] }) {
  return (
    <ChartCard
      title="Margin trend"
      question="Is profitability improving or eroding?"
      chart={
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              accessibilityLayer
              title="EBITDA, EBIT, and net margin by fiscal year"
              desc="Line chart with three margin series. Use the arrow keys to move between years; the tooltip shows all three margins for the focused year."
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "var(--border)" }} fontSize={11} />
              <YAxis tickFormatter={formatPercent} tickLine={false} axisLine={false} fontSize={11} width={48} />
              <Tooltip
                content={
                  <ChartTooltipContent />
                }
                cursor={{ stroke: "var(--border)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="ebitdaMargin" name="EBITDA %" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="ebitMargin" name="EBIT %" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="netMargin" name="Net %" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-normal">Year</th>
              <th className="py-1.5 font-normal">EBITDA %</th>
              <th className="py-1.5 font-normal">EBIT %</th>
              <th className="py-1.5 font-normal">Net %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.year} className="border-b border-border last:border-0">
                <td className="py-1.5 font-mono">{d.year}</td>
                <td className="py-1.5 font-mono tabular-nums">{d.ebitdaMargin !== null ? formatPercent(d.ebitdaMargin) : "—"}</td>
                <td className="py-1.5 font-mono tabular-nums">{d.ebitMargin !== null ? formatPercent(d.ebitMargin) : "—"}</td>
                <td className="py-1.5 font-mono tabular-nums">{d.netMargin !== null ? formatPercent(d.netMargin) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    />
  );
}
