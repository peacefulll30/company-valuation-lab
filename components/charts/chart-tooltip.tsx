"use client";

type TooltipEntry = {
  name: string;
  value: number;
  color?: string;
  formatter?: (value: number) => string;
};

/**
 * Shared Recharts tooltip content: exact values (never a re-statement of
 * the axis), flat card matching the design system's hairline-border
 * language — no drop shadow, no gradient (dataviz skill; CLAUDE.md design
 * system).
 */
export function ChartTooltipContent({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string; payload?: Record<string, unknown> }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-none">
      {label ? <p className="mb-1 font-medium text-popover-foreground">{label}</p> : null}
      <dl className="flex flex-col gap-0.5">
        {payload.map((entry, i) => (
          <div key={`${entry.dataKey ?? entry.name ?? i}`} className="flex items-center gap-2">
            {entry.color ? (
              <span
                aria-hidden="true"
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            ) : null}
            <dt className="text-muted-foreground">{entry.name}:</dt>
            <dd className="font-mono tabular-nums text-popover-foreground">
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export type { TooltipEntry };
