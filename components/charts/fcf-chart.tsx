"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "./chart-card";
import { ChartTooltipContent } from "./chart-tooltip";
import { formatCompactCurrency } from "@/lib/format";

export type FcfPoint = { year: number; freeCashFlow: number };

/** Chart #3 (Design spec §5) — single-series bar crossing zero. Answers: is cash generation strong, weak, or volatile? */
export function FcfChart({ data }: { data: FcfPoint[] }) {
  return (
    <ChartCard
      title="Free cash flow"
      question="Is cash generation strong, weak, or volatile?"
      chart={
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              accessibilityLayer
              title="Free cash flow by fiscal year"
              desc="Bar chart, one series. Use the arrow keys to move between years; the tooltip shows the exact free cash flow for the focused year."
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "var(--border)" }} fontSize={11} />
              <YAxis tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} fontSize={11} width={56} />
              <ReferenceLine y={0} stroke="var(--baseline, var(--border))" />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="freeCashFlow" name="Free cash flow" fill="var(--chart-1)" radius={[3, 3, 3, 3]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-normal">Year</th>
              <th className="py-1.5 font-normal">Free cash flow</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.year} className="border-b border-border last:border-0">
                <td className="py-1.5 font-mono">{d.year}</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCompactCurrency(d.freeCashFlow)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    />
  );
}
