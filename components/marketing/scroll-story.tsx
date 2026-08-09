"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Container } from "@/components/brand/container";
import { StageVisual, type StageVisualKey } from "@/components/marketing/stage-visual";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export type ScrollStoryItem = {
  step: string;
  title: string;
  description: string;
  visual: StageVisualKey;
};

/**
 * Shared "numbered list + detail panel" mechanism for "What can this
 * platform do?" and "How the valuation is built" — all N items sit in
 * their own fixed row, always visible; only ONE dedicated panel on the
 * right ever shows a description/visual, cross-fading between items. This
 * replaces an earlier version that stacked every item's title/description
 * absolutely on top of the others (`inset-0`, opacity floor > 0) — during
 * a transition two items would both sit at ~50% opacity in the exact same
 * physical spot, reading as broken, overlapping text. Nothing here is ever
 * positioned on top of anything else.
 *
 * Desktop ties the active row to scroll position (a tall sticky container,
 * Framer reading `scrollYProgress` — scroll-*linked*, never intercepted:
 * native scroll always wins, satisfying the "no scroll-jacking" rule) but
 * a row can also be *clicked*, which smooth-scrolls the page to that row's
 * slice of the tall container. Below `lg` there's no sticky pinning at
 * all — a plain stacked list, each row fully visible in normal flow.
 */
export function ScrollStory({
  eyebrow,
  heading,
  items,
  showProgressPath = false,
}: {
  eyebrow: string;
  heading: string;
  items: ScrollStoryItem[];
  /** A connecting line down the number column, illuminating as each stage is reached ("guided process" framing). */
  showProgressPath?: boolean;
}) {
  return (
    <section className="border-b border-border py-16 sm:py-20" aria-label={heading}>
      <Container>
        <SectionHeading eyebrow={eyebrow} heading={heading} />
      </Container>

      <div className="mt-10 hidden lg:block">
        <DesktopScrollStory items={items} showProgressPath={showProgressPath} />
      </div>

      <Container className="mt-8 lg:hidden">
        <MobileStackedStory items={items} />
      </Container>
    </section>
  );
}

function SectionHeading({ eyebrow, heading }: { eyebrow: string; heading: string }) {
  return (
    <div>
      <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-medium sm:text-4xl">{heading}</h2>
    </div>
  );
}

function DesktopScrollStory({ items, showProgressPath }: { items: ScrollStoryItem[]; showProgressPath: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const n = items.length;

  const rawIndex = useTransform(scrollYProgress, [0, 1], [0, n - 0.001]);
  const discreteIndex = useTransform(rawIndex, (v) => Math.min(n - 1, Math.max(0, Math.floor(v))));
  useMotionValueEvent(discreteIndex, "change", (value) => setActiveIndex(value));

  const handleSelect = useCallback(
    (index: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const containerTop = rect.top + window.scrollY;
      const scrollable = Math.max(0, el.offsetHeight - window.innerHeight);
      const targetProgress = (index + 0.5) / n;
      const targetY = containerTop + scrollable * targetProgress;
      window.scrollTo({ top: targetY, behavior: prefersReducedMotion ? "auto" : "smooth" });
    },
    [n, prefersReducedMotion]
  );

  if (prefersReducedMotion) {
    return (
      <Container className="flex flex-col gap-10 py-10">
        {items.map((item) => (
          <StoryItemStatic key={item.step} item={item} />
        ))}
      </Container>
    );
  }

  return (
    <div ref={containerRef} style={{ height: `${n * 46}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center">
        <Container className="w-full">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(260px,340px)_1fr] lg:gap-16">
            <ol className={cn("relative flex flex-col", showProgressPath && "pl-6")}>
              {showProgressPath ? <ProgressLine scrollYProgress={scrollYProgress} /> : null}
              {items.map((item, i) => (
                <StoryListRow
                  key={item.step}
                  item={item}
                  isActive={i === activeIndex}
                  isPassed={i < activeIndex}
                  onSelect={() => handleSelect(i)}
                />
              ))}
            </ol>

            <div className="relative min-h-72">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_1fr]"
                >
                  <p className="text-base text-muted-foreground sm:text-lg">{items[activeIndex].description}</p>
                  <StageVisual
                    variant={items[activeIndex].visual}
                    active
                    className="hidden aspect-[11/8] w-full sm:block"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}

function StoryListRow({
  item,
  isActive,
  isPassed,
  onSelect,
}: {
  item: ScrollStoryItem;
  isActive: boolean;
  isPassed: boolean;
  onSelect: () => void;
}) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? "true" : undefined}
        className={cn(
          "group flex w-full items-baseline gap-4 rounded-sm py-3.5 text-left outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <span
          className={cn(
            "font-mono text-xs tabular-nums transition-colors duration-300",
            isActive ? "text-brand-accent" : isPassed ? "text-brand-accent/45" : "text-muted-foreground"
          )}
        >
          {item.step}
        </span>
        <span
          className={cn(
            "font-display text-xl font-medium transition-all duration-300 sm:text-2xl",
            isActive ? "text-foreground" : "text-muted-foreground/70 group-hover:text-muted-foreground"
          )}
        >
          {item.title}
        </span>
      </button>
    </li>
  );
}

function ProgressLine({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const fillHeight = useTransform(scrollYProgress, [0, 1], ["2%", "100%"]);

  return (
    <div className="absolute top-3 bottom-3 left-0 w-px bg-border" aria-hidden="true">
      <motion.div
        className="absolute top-0 left-0 w-px bg-brand-accent shadow-[0_0_8px_var(--brand-glow)]"
        style={{ height: fillHeight }}
      />
    </div>
  );
}

function StoryItemStatic({ item }: { item: ScrollStoryItem }) {
  return (
    <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col items-start gap-3">
        <span className="font-mono text-xs tracking-[0.18em] text-brand-accent uppercase">{item.step}</span>
        <h3 className="font-display text-3xl font-medium">{item.title}</h3>
        <p className="max-w-lg text-base text-muted-foreground">{item.description}</p>
      </div>
      <StageVisual variant={item.visual} active={false} className="hidden aspect-[11/8] w-full sm:block" />
    </div>
  );
}

function MobileStackedStory({ items }: { items: ScrollStoryItem[] }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-10">
      {items.map((item) => (
        <motion.div
          key={item.step}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, ease: EASE }}
          className={cn("flex flex-col gap-2 border-l-2 border-border py-1 pl-5")}
        >
          <span className="font-mono text-xs tracking-[0.18em] text-brand-accent uppercase">{item.step}</span>
          <h3 className="font-display text-2xl font-medium">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
