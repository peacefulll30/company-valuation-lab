"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartCard } from "./chart-card";
import { formatCurrency } from "@/lib/format";

export type ScenarioPoint = { label: "Bear" | "Base" | "Bull"; price: number };

/**
 * Chart #6 (Design spec §5) — 3 bars, diverging pair + neutral, direct-
 * labeled. The one chart where the diverging pair is the correct choice
 * (the poles are literally negative/neutral/positive), not decorative.
 */
export function ScenarioComparisonChart({ data }: { data: ScenarioPoint[] }) {
  const colorFor = (label: ScenarioPoint["label"]) =>
    label === "Bear" ? "var(--chart-4)" : label === "Bull" ? "var(--chart-5)" : "var(--chart-1)";

  return (
    <ChartCard
      title="Bear / Base / Bull"
      question="How much does the operating story move the answer?"
      chart={
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 8, left: 0, bottom: 0 }}
              accessibilityLayer
              title="Bear, Base, and Bull implied share price"
              desc="Bar chart comparing the three scenarios; exact values are labeled directly above each bar. Use the arrow keys to move between scenarios."
            >
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--border)" }} fontSize={12} />
              <YAxis hide />
              <Bar dataKey="price" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.label} fill={colorFor(d.label)} />
                ))}
                <LabelList
                  dataKey="price"
                  position="top"
                  formatter={(value?: unknown) => (typeof value === "number" ? formatCurrency(value) : "")}
                  className="fill-foreground font-mono text-xs"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-normal">Scenario</th>
              <th className="py-1.5 font-normal">Implied share price</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-border last:border-0">
                <td className="py-1.5">{d.label}</td>
                <td className="py-1.5 font-mono tabular-nums">{formatCurrency(d.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    />
  );
}
