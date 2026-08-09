"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type RangeBracketProps = {
  /** Resting width in px — the resolved, final range width. */
  width?: number;
  /** Height of the end-ticks in px. */
  tickHeight?: number;
  /**
   * Plays a once-only "wide range narrowing to a resolved width" animation
   * on mount (Design spec §1, §2 — the hero's data-motion moment and the
   * shared loading-state motif). Respects prefers-reduced-motion.
   */
  animateResolve?: boolean;
  className?: string;
};

/**
 * The product's signature glyph: a thin bracket with two end ticks —
 * ⊢────⊣ — standing in for "a range, not a point." Decorative by default;
 * pair with real numeric labels for meaning (never color/shape alone).
 */
export function RangeBracket({
  width = 120,
  tickHeight = 10,
  animateResolve = false,
  className,
}: RangeBracketProps) {
  const prefersReducedMotion = useReducedMotion();
  const play = animateResolve && !prefersReducedMotion;
  const wideScale = 2.1;
  const originX = width / 2;
  const originY = tickHeight / 2;

  return (
    <svg
      role="presentation"
      aria-hidden="true"
      width={width}
      height={tickHeight}
      viewBox={`0 0 ${width} ${tickHeight}`}
      className={cn("overflow-visible text-brand-accent", className)}
    >
      <motion.g
        style={{ transformOrigin: `${originX}px ${originY}px` }}
        initial={play ? { scaleX: wideScale, opacity: 0.4 } : false}
        animate={play ? { scaleX: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      >
        <line
          x1={0}
          y1={originY}
          x2={width}
          y2={originY}
          stroke="currentColor"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={tickHeight}
          stroke="currentColor"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={width}
          y1={0}
          x2={width}
          y2={tickHeight}
          stroke="currentColor"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>
    </svg>
  );
}
