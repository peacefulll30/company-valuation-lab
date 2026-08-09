"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "./chart-card";
import { ChartTooltipContent } from "./chart-tooltip";
import { formatCompactCurrency } from "@/lib/format";

export type HistoricalVsForecastPoint = { year: number; revenue: number; isForecast: boolean };

/**
 * Chart #4 (Design spec §5) — same form as Revenue/EBITDA, extended to 10
 * years; forecast bars render at reduced opacity (same hue, less
 * committed). Answers: how aggressive is the forecast relative to history?
 */
export function HistoricalVsForecastChart({ data }: { data: HistoricalVsForecastPoint[] }) {
  const firstForecastYear = data.find((d) => d.isForecast)?.year;

  return (
    <ChartCard
      title="Historical vs. forecast revenue"
      question="How aggressive is the forecast relative to real history?"
      chart={
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              accessibilityLayer
              title="Historical and forecast revenue by fiscal year"
              desc="Bar chart; forecast years render at reduced opacity. Use the arrow keys to move between years; the tooltip shows revenue and whether the year is historical or forecast."
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "var(--border)" }} fontSize={11} />
              <YAxis tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} fontSize={11} width={56} />
              {firstForecastYear ? (
                <ReferenceLine x={firstForecastYear} stroke="var(--border)" strokeDasharray="3 3" />
              ) : null}
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="revenue" name="Revenue" radius={[3, 3, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.year} fill="var(--chart-1)" fillOpacity={d.isForecast ? 0.45 : 1} />
                ))}
              </Bar>
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
              <th className="py-1.5 font-normal">Type</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.year} className="border-b border-border last:border-0">
                <td className="py-1.5 font-mono">{d.year}</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCompactCurrency(d.revenue)}</td>
                <td className="py-1.5 text-muted-foreground">{d.isForecast ? "Forecast" : "Historical"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    />
  );
}
