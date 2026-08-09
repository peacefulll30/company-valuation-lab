"use client";

import { useId, useState, type ReactNode } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  /** One sentence: the question this chart answers (dataviz skill — every chart needs a stated purpose). */
  question: string;
  chart: ReactNode;
  table: ReactNode;
  className?: string;
};

/**
 * Shared chart shell (dataviz skill, CLAUDE.md "Charts / dataviz"): a
 * titled card with a "view as table" toggle — the accessibility escape
 * hatch every chart ships (full keyboard/screen-reader access to the exact
 * data, not just the visual encoding).
 *
 * Keyboard access to the chart marks themselves (not just the table
 * fallback) comes from Recharts 3's built-in `accessibilityLayer`
 * (default on): it puts `role="application" tabIndex={0}` on the chart's
 * SVG root and wires arrow-key navigation between data points, updating
 * whatever `<Tooltip content>` is configured as focus moves — the same
 * custom tooltip content already used for hover, since Recharts exposes
 * `active`/`payload` identically regardless of trigger source. Individual
 * chart components pass `title`/`desc` (rendered as real SVG `<title>`/
 * `<desc>` elements) to give that focusable region a meaningful accessible
 * name — see any file in this directory for the pattern. This is
 * deliberately not a from-scratch per-mark `tabIndex` implementation: the
 * framework already provides it, and duplicating it would risk fighting
 * Recharts' own event handling instead of using it.
 */
export function ChartCard({ title, question, chart, table, className }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const descriptionId = useId();

  return (
    <div className={cn("rounded-md border border-border bg-card p-4 sm:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p id={descriptionId} className="mt-0.5 text-xs text-muted-foreground">
            {question}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-pressed={showTable}
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? <BarChart3 className="size-3.5" aria-hidden="true" /> : <Table2 className="size-3.5" aria-hidden="true" />}
          {showTable ? "View chart" : "View as table"}
        </Button>
      </div>
      <div className="mt-4" aria-describedby={descriptionId}>
        {showTable ? table : chart}
      </div>
    </div>
  );
}
