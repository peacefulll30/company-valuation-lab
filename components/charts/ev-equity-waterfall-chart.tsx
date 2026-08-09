"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "./chart-card";
import { formatCompactCurrency } from "@/lib/format";

type WaterfallDatum = {
  label: string;
  base: number;
  delta: number;
  displayValue: number;
  kind: "total" | "increase" | "decrease";
};

/**
 * Chart #5 (Design spec §5) — floating bars: EV → (− Net Debt) → Equity
 * Value. Recharts has no native waterfall type; built as a stacked bar
 * (invisible `base` + visible `delta`). Answers: how do we get from
 * enterprise value to a share price?
 */
export function EvEquityWaterfallChart({
  enterpriseValue,
  netDebt,
  equityValue,
  impliedSharePrice,
}: {
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  impliedSharePrice: number;
}) {
  const data: WaterfallDatum[] = [
    { label: "Enterprise Value", base: 0, delta: enterpriseValue, displayValue: enterpriseValue, kind: "total" },
    {
      label: netDebt >= 0 ? "− Net Debt" : "+ Net Cash",
      base: Math.min(enterpriseValue, equityValue),
      delta: Math.abs(enterpriseValue - equityValue),
      displayValue: -netDebt,
      kind: netDebt >= 0 ? "decrease" : "increase",
    },
    { label: "Equity Value", base: 0, delta: equityValue, displayValue: equityValue, kind: "total" },
  ];

  const colorFor = (kind: WaterfallDatum["kind"]) =>
    kind === "total" ? "var(--chart-1)" : kind === "increase" ? "var(--chart-5)" : "var(--chart-4)";

  return (
    <ChartCard
      title="EV → Equity Value bridge"
      question="How do we get from enterprise value to a share price?"
      chart={
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              accessibilityLayer
              title="Enterprise value to equity value bridge"
              desc="Bar chart showing the step from enterprise value to equity value. Use the arrow keys to move between steps; the tooltip shows the exact value for the focused step."
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--border)" }} fontSize={11} />
              <YAxis tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} fontSize={11} width={56} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as WaterfallDatum;
                  return (
                    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs">
                      <p className="font-medium text-popover-foreground">{d.label}</p>
                      <p className="mt-0.5 font-mono tabular-nums text-popover-foreground">
                        {formatCompactCurrency(d.displayValue)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="delta" stackId="wf" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.label} fill={colorFor(d.kind)} />
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
              <th className="py-1.5 font-normal">Step</th>
              <th className="py-1.5 font-normal">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-border last:border-0">
                <td className="py-1.5">{d.label}</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCompactCurrency(d.displayValue)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-1.5 font-medium">Implied Share Price</td>
              <td className="py-1.5 font-mono font-medium tabular-nums">{formatCompactCurrency(impliedSharePrice)}</td>
            </tr>
          </tbody>
        </table>
      }
    />
  );
}
