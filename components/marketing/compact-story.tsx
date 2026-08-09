"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/brand/container";
import { StageVisual, type StageVisualKey } from "@/components/marketing/stage-visual";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export type CompactStoryItem = {
  step: string;
  title: string;
  description: string;
  visual: StageVisualKey;
};

/**
 * "Four tools, one model" and "How the valuation is built" (V1.3) — all N
 * items visible at once, in a compact row (never a tall scroll-driven
 * section): click or hover a step to make it active, which crossfades a
 * single description + visual panel beneath. Replaces the earlier
 * sticky-scroll `ScrollStory` mechanism for these two sections — that
 * pattern needed a full extra scroll pass per section (and the empty
 * black space that came with it); this fits in roughly one viewport and
 * never hides or heavily blurs an inactive item.
 */
export function CompactStory({
  eyebrow,
  heading,
  items,
  showProgressPath = false,
}: {
  eyebrow: string;
  heading: string;
  items: CompactStoryItem[];
  /** A horizontal connecting rail beneath the steps, filling to the active one ("guided process" framing). */
  showProgressPath?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];

  return (
    <section className="border-b border-border py-14 sm:py-16" aria-label={heading}>
      <Container>
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl font-medium sm:text-4xl">{heading}</h2>
        </div>

        <div className="mt-8 sm:mt-10">
          <ItemRow items={items} activeIndex={activeIndex} onSelect={setActiveIndex} showProgressPath={showProgressPath} />

          <div className="mt-6 grid grid-cols-1 items-center gap-8 rounded-xl border border-border bg-card/60 p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="text-base text-muted-foreground sm:text-lg"
              >
                {active.description}
              </motion.p>
            </AnimatePresence>
            <StageVisual variant={active.visual} active className="aspect-[11/8] w-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}

function ItemRow({
  items,
  activeIndex,
  onSelect,
  showProgressPath,
}: {
  items: CompactStoryItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  showProgressPath: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const fillPercent = items.length > 1 ? (activeIndex / (items.length - 1)) * 100 : 0;

  return (
    <div className="relative">
      {showProgressPath ? (
        <div className="absolute top-[19px] right-[12.5%] left-[12.5%] hidden h-px bg-border sm:block" aria-hidden="true">
          <motion.div
            className="h-px bg-brand-accent shadow-[0_0_8px_var(--brand-glow)]"
            initial={false}
            animate={{ width: `${fillPercent}%` }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32 }}
          />
        </div>
      ) : null}

      <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => onSelect(i)}
              onMouseEnter={() => onSelect(i)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "group flex flex-col items-start gap-2.5 rounded-lg border px-4 py-3.5 text-left outline-none transition-colors duration-300",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive ? "border-brand-accent/50 bg-accent/70" : "border-border hover:border-muted-foreground/40"
              )}
            >
              <span
                className={cn(
                  "relative z-10 flex size-6 items-center justify-center rounded-full border bg-background font-mono text-[11px] tabular-nums transition-colors duration-300",
                  isActive ? "border-brand-accent text-brand-accent" : "border-border text-muted-foreground"
                )}
              >
                {item.step}
              </span>
              <span className={cn("text-sm font-medium transition-colors duration-300 sm:text-base", isActive ? "text-foreground" : "text-muted-foreground")}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
