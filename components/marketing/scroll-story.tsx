"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Container } from "@/components/brand/container";
import { cn } from "@/lib/utils";

export type ScrollStoryItem = {
  step: string;
  title: string;
  description: string;
};

/**
 * Shared progressive-reveal mechanism (Design spec §2 marketing shell) for
 * "What can this platform do?" and "How the valuation is built" — one item
 * dominant at a time as the user scrolls, neighbors visible but receded.
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
}: {
  eyebrow: string;
  heading: string;
  items: ScrollStoryItem[];
}) {
  return (
    <section className="border-b border-border py-20 sm:py-28" aria-label={heading}>
      <Container>
        <SectionHeading eyebrow={eyebrow} heading={heading} />
      </Container>

      {/* Desktop / tablet-landscape: sticky scroll story. */}
      <div className="mt-4 hidden lg:block">
        <DesktopScrollStory items={items} />
      </div>

      {/* Mobile / tablet: simple stacked reveal, no sticky pinning. */}
      <Container className="mt-10 lg:hidden">
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

function DesktopScrollStory({ items }: { items: ScrollStoryItem[] }) {
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
    <div ref={containerRef} style={{ height: `${n * 70}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <Container className="relative w-full">
          <div className="relative mx-auto max-w-2xl">
            {items.map((item, i) => (
              <StoryItemAnimated
                key={item.step}
                item={item}
                index={i}
                count={n}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
        </Container>
      </div>
    </div>
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
  const peakStart = start + slice * 0.25;
  const peakEnd = start + slice * 0.75;
  const end = start + slice;

  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, start - slice * 0.3), start, peakStart, peakEnd, end, Math.min(1, end + slice * 0.3)],
    [0.12, 0.28, 1, 1, 0.28, 0.12]
  );
  const scale = useTransform(
    scrollYProgress,
    [start, peakStart, peakEnd, end],
    [0.94, 1, 1, 0.94]
  );
  const y = useTransform(scrollYProgress, [start, peakStart, peakEnd, end], [24, 0, 0, -24]);
  const blur = useTransform(
    scrollYProgress,
    [Math.max(0, start - slice * 0.3), start, peakStart, peakEnd, end, Math.min(1, end + slice * 0.3)],
    [4, 2, 0, 0, 2, 4]
  );
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <motion.div
      style={{ opacity, scale, y, filter }}
      className="absolute inset-0 flex flex-col items-start gap-4"
    >
      <span className="font-mono text-xs tracking-[0.18em] text-brand-accent uppercase">
        {item.step}
      </span>
      <h3 className="font-display text-4xl font-medium text-balance sm:text-5xl">{item.title}</h3>
      <p className="max-w-lg text-base text-muted-foreground sm:text-lg">{item.description}</p>
    </motion.div>
  );
}

function StoryItemStatic({ item }: { item: ScrollStoryItem }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="font-mono text-xs tracking-[0.18em] text-brand-accent uppercase">{item.step}</span>
      <h3 className="font-display text-3xl font-medium">{item.title}</h3>
      <p className="max-w-lg text-base text-muted-foreground">{item.description}</p>
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
