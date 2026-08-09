"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Container } from "@/components/brand/container";
import { StageVisual, type StageVisualKey } from "@/components/marketing/stage-visual";
import { cn } from "@/lib/utils";

export type ScrollStoryItem = {
  step: string;
  title: string;
  description: string;
  visual: StageVisualKey;
};

/**
 * Shared progressive-reveal mechanism (Design spec §2 marketing shell) for
 * "What can this platform do?" and "How the valuation is built" — one item
 * dominant at a time as the user scrolls, neighbors visible but receded
 * (never blurred to the point of looking broken — see the floor values in
 * `StoryItemAnimated`).
 *
 * This is scroll-*linked* animation (CSS `position: sticky` + Framer
 * Motion reading scroll progress to drive opacity/scale), not scroll-
 * *jacking*: native scroll input is never intercepted, captured, or
 * overridden — the design system's existing "no scroll-jacking" rule
 * (§7) still holds. Desktop gets the sticky/pinned treatment; below `lg`
 * it degrades to a plain stacked fade-in-on-view list — no sticky
 * pinning on mobile, per the brief's own "mobile must remain simple."
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
  /** A vertical, scroll-lit progress rail beside the text (Methodology's "guided process" framing). */
  showProgressPath?: boolean;
}) {
  return (
    <section className="border-b border-border py-16 sm:py-20" aria-label={heading}>
      <Container>
        <SectionHeading eyebrow={eyebrow} heading={heading} />
      </Container>

      {/* Desktop / tablet-landscape: sticky scroll story. */}
      <div className="mt-2 hidden lg:block">
        <DesktopScrollStory items={items} showProgressPath={showProgressPath} />
      </div>

      {/* Mobile / tablet: simple stacked reveal, no sticky pinning. */}
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
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Reduced motion: skip the pinned mechanism entirely and just stack the
  // items normally (still inside the same tall container, so no layout
  // jump versus the animated version — just no motion).
  if (prefersReducedMotion) {
    return (
      <Container className="flex flex-col gap-10 py-10">
        {items.map((item) => (
          <StoryItemStatic key={item.step} item={item} />
        ))}
      </Container>
    );
  }

  const n = items.length;

  return (
    <div ref={containerRef} style={{ height: `${n * 52}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <Container className="relative w-full">
          <div className={cn("relative flex w-full items-center gap-10", showProgressPath && "pl-6")}>
            {showProgressPath ? <ProgressPath count={n} scrollYProgress={scrollYProgress} /> : null}
            <div className="relative h-[46vh] min-h-80 flex-1">
              {items.map((item, i) => (
                <StoryItemAnimated key={item.step} item={item} index={i} count={n} scrollYProgress={scrollYProgress} />
              ))}
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}

function ProgressPath({ count, scrollYProgress }: { count: number; scrollYProgress: MotionValue<number> }) {
  const fillHeight = useTransform(scrollYProgress, [0, 1], ["2%", "100%"]);

  return (
    <div className="relative hidden h-[46vh] min-h-80 w-px shrink-0 bg-border sm:block">
      <motion.div
        className="absolute top-0 left-0 w-px bg-brand-accent shadow-[0_0_8px_var(--brand-glow)]"
        style={{ height: fillHeight }}
      />
      {Array.from({ length: count }).map((_, i) => (
        <ProgressDot key={i} at={count === 1 ? 0 : i / (count - 1)} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}

/** Split out so `useTransform` runs at this component's own top level, not inside the parent's `.map()` (Rules of Hooks). */
function ProgressDot({ at, scrollYProgress }: { at: number; scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [Math.max(0, at - 0.08), at], [0.3, 1]);
  return (
    <motion.span
      className="absolute -left-[3px] size-[7px] rounded-full bg-brand-accent"
      style={{ top: `${at * 100}%`, opacity }}
    />
  );
}

function StoryItemAnimated({
  item,
  index,
  count,
  scrollYProgress,
}: {
  item: ScrollStoryItem;
  index: number;
  count: number;
  scrollYProgress: MotionValue<number>;
}) {
  const slice = 1 / count;
  const start = index * slice;
  const peakStart = start + slice * 0.15;
  const peakEnd = start + slice * 0.85;
  const end = start + slice;

  // Higher floor (0.38, not near-zero) so inactive stages stay legibly
  // "quieter," never blurred into looking broken — a wider peak plateau
  // (70% of each slice) so the active stage settles in and stays sharp
  // sooner rather than only for an instant mid-scroll.
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, start - slice * 0.25), start, peakStart, peakEnd, end, Math.min(1, end + slice * 0.25)],
    [0.38, 0.5, 1, 1, 0.5, 0.38]
  );
  const scale = useTransform(scrollYProgress, [start, peakStart, peakEnd, end], [0.97, 1, 1, 0.97]);
  const y = useTransform(scrollYProgress, [start, peakStart, peakEnd, end], [16, 0, 0, -16]);
  const blur = useTransform(
    scrollYProgress,
    [Math.max(0, start - slice * 0.25), start, peakStart, peakEnd, end, Math.min(1, end + slice * 0.25)],
    [1.5, 0.8, 0, 0, 0.8, 1.5]
  );
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  // `useTransform` alone returns a MotionValue, which updates the DOM
  // directly and does *not* trigger a React re-render — fine for style
  // bindings, not enough for `StageVisual`'s `active` prop, which decides
  // which `animate` target to use. `useMotionValueEvent` mirrors the
  // derived boolean into real state so the visual actually reacts as the
  // user scrolls; it only fires at the two slice boundaries per item
  // (entering/leaving "active"), not on every scroll tick, so this stays
  // cheap.
  const activeMotionValue = useTransform(scrollYProgress, (p) => p >= start && p < end);
  const [isActive, setIsActive] = useState(activeMotionValue.get());
  useMotionValueEvent(activeMotionValue, "change", (value) => setIsActive(value));

  return (
    <motion.div
      style={{ opacity, scale, y, filter }}
      className="absolute inset-0 grid grid-cols-1 items-center gap-8 sm:grid-cols-[1.1fr_0.9fr]"
    >
      <div className="flex flex-col items-start gap-3">
        <span className="font-mono text-xs tracking-[0.18em] text-brand-accent uppercase">{item.step}</span>
        <h3 className="font-display text-4xl font-medium text-balance sm:text-5xl">{item.title}</h3>
        <p className="max-w-lg text-base text-muted-foreground sm:text-lg">{item.description}</p>
      </div>
      <StageVisual variant={item.visual} active={isActive} className="hidden aspect-[11/8] w-full sm:block" />
    </motion.div>
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
      {/* Reduced motion means less motion, not less content — the settled (non-animating) frame of the same visual. */}
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
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, ease: [0.16, 1, 0.3, 1] }}
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
