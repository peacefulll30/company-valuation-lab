"use client";

import { useId, type ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ConceptInfo } from "@/components/valuation/concept-info";
import type { ConceptKey } from "@/lib/concepts";

type AssumptionInputProps = {
  label: string;
  /** Fraction, e.g. 0.08 for 8%. */
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** e.g. a source/as-of tag rendered under the label (WACC's pre-filled default). */
  sourceTag?: string;
  /** Renders a "What is this?" popover next to the label — only where the term itself needs explaining (e.g. WACC). */
  concept?: ConceptKey;
  /** Small status indicator next to the label — e.g. WACC's AUTO/MANUAL badge. */
  badge?: ReactNode;
};

/** Mandatory-assumption pattern (Design spec §4/§3.x Forecast): a slider synced with a numeric field, both in %. */
export function AssumptionInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.001,
  sourceTag,
  concept,
  badge,
}: AssumptionInputProps) {
  const inputId = useId();
  const percentValue = Math.round(value * 1000) / 10; // one decimal place, in %

  function handlePercentInput(next: string) {
    const parsed = Number.parseFloat(next);
    if (!Number.isFinite(parsed)) return;
    // The numeric field is synced with the slider below and must respect
    // the same bounds — without this, typing (rather than dragging) was the
    // one path that let an assumption reach an absurd, uncapped value.
    const clamped = Math.min(Math.max(parsed / 100, min), max);
    onChange(clamped);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label htmlFor={inputId} className="text-sm font-medium">
            {label}
          </label>
          {concept ? <ConceptInfo concept={concept} /> : null}
          {badge}
        </div>
        <div className="flex items-center gap-1">
          <Input
            id={inputId}
            type="number"
            inputMode="decimal"
            step={0.1}
            min={min * 100}
            max={max * 100}
            value={percentValue}
            onChange={(e) => handlePercentInput(e.target.value)}
            className="h-7 w-20 text-right text-sm font-medium tabular-nums"
            aria-describedby={sourceTag ? `${inputId}-source` : undefined}
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
        aria-label={label}
      />
      {sourceTag ? (
        <p id={`${inputId}-source`} className="font-mono text-[11px] text-muted-foreground">
          {sourceTag}
        </p>
      ) : null}
    </div>
  );
}
