"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { concepts, type ConceptKey } from "@/lib/concepts";

/**
 * The in-workspace "What is this?" affordance — a small, keyboard-operable
 * info trigger next to a term (DCF, WACC, Sensitivity, ...) that reveals a
 * short plain-language explanation without leaving the page or reflowing
 * the surrounding layout. Click/Enter/Space to open; Escape or an outside
 * click closes it (native Radix Popover behavior).
 */
export function ConceptInfo({ concept }: { concept: ConceptKey }) {
  const { label, summary } = concepts[concept];

  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-brand-accent focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`What is ${label}?`}
      >
        <Info className="size-3.5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent>
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-popover-foreground">{summary}</p>
      </PopoverContent>
    </Popover>
  );
}
