"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "./chart-card";
import { ChartTooltipContent } from "./chart-tooltip";
import { formatCompactCurrency } from "@/lib/format";

export type RevenueEbitdaPoint = { year: number; revenue: number; ebitda: number };

/** Chart #1 (Design spec §5) — grouped bars, one $ axis. Answers: is growth converting to profit? */
export function RevenueEbitdaChart({ data }: { data: RevenueEbitdaPoint[] }) {
  return (
    <ChartCard
      title="Revenue / EBITDA"
      question="Is growth converting to profit?"
      chart={
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              accessibilityLayer
              title="Revenue and EBITDA by fiscal year"
              desc="Grouped bar chart. Use the arrow keys to move between years; the tooltip shows revenue and EBITDA for the focused year."
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "var(--border)" }} fontSize={11} />
              <YAxis
                tickFormatter={formatCompactCurrency}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={56}
              />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ebitda" name="EBITDA (derived)" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-normal">Year</th>
              <th className="py-1.5 font-normal">Revenue</th>
              <th className="py-1.5 font-normal">EBITDA</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.year} className="border-b border-border last:border-0">
                <td className="py-1.5 font-mono">{d.year}</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCompactCurrency(d.revenue)}</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCompactCurrency(d.ebitda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    />
  );
}
