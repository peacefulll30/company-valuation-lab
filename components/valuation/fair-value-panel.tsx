import { cn } from "@/lib/utils";
import { RangeBracket } from "@/components/brand/range-bracket";
import { formatCurrency } from "@/lib/format";

type FairValuePanelProps = {
  className?: string;
  /**
   * "sidebar" = stacked block in the desktop sidebar footer. "bar" = the
   * slim sticky horizontal footer that replaces it below the desktop
   * breakpoint (Design spec §3 — "moves to a slim sticky footer bar
   * instead of a sidebar footer").
   */
  variant?: "sidebar" | "bar";
  /** Real computed data — omit to render the honest "not yet calculated" placeholder. */
  data?: { base: number; low: number; high: number };
};

/**
 * The persistent "Fair Value" stat (Design spec §3) — the one number the
 * whole product exists to produce, visible from every workspace tab. Only
 * ever shows a real, engine-computed number (`data`) or the honest
 * placeholder — never a fabricated figure (CLAUDE.md). Brand-accent color
 * is reserved for exactly this "one answer number per screen."
 */
export function FairValuePanel({ className, variant = "sidebar", data }: FairValuePanelProps) {
  const valueClass = data ? "text-brand-accent" : "text-muted-foreground";
  const bracketClass = data ? "text-brand-accent" : "text-muted-foreground";

  if (variant === "bar") {
    return (
      <div className={cn("flex items-center justify-between gap-3 px-4 py-2.5", className)}>
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          Fair value
        </p>
        <div className="flex items-center gap-2.5">
          <RangeBracket width={48} tickHeight={7} className={bracketClass} />
          <p className={cn("font-display text-base", valueClass)}>
            {data ? formatCurrency(data.base) : "Not yet calculated"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4", className)}>
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        Fair value
      </p>
      <p className={cn("mt-1 font-display text-2xl", valueClass)}>
        {data ? formatCurrency(data.base) : "Not yet calculated"}
      </p>
      {data ? (
        <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
          {formatCurrency(data.low)}&ndash;{formatCurrency(data.high)}
        </p>
      ) : null}
      <RangeBracket width={64} tickHeight={7} className={cn("mt-2", bracketClass)} />
    </div>
  );
}
