"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The hero's "live" background (Design spec §2) — an extension of the
 * product's existing range-bracket signature (§1), not a generic particle
 * system: a handful of drifting bracket-tick fragments and value/number
 * fragments, fading in and out at low opacity. Fixed, hand-authored
 * positions (not `Math.random()`) so server and client markup match
 * exactly — a hydration-safety requirement, not a style choice.
 *
 * GPU-cheap by construction: only `opacity`/`transform` animate, a small
 * fixed element count, no continuous re-renders. `prefers-reduced-motion`
 * freezes everything to a single still frame.
 */

const TICKS: Array<{ top: string; left: string; width: number; delay: number; duration: number }> = [
  { top: "18%", left: "8%", width: 64, delay: 0, duration: 9 },
  { top: "72%", left: "14%", width: 44, delay: 2.4, duration: 11 },
  { top: "30%", left: "82%", width: 56, delay: 1.1, duration: 10 },
  { top: "64%", left: "88%", width: 40, delay: 3.6, duration: 8.5 },
  { top: "85%", left: "60%", width: 52, delay: 5, duration: 12 },
];

const FRAGMENTS: Array<{ top: string; left: string; delay: number; duration: number; text: string }> = [
  { top: "24%", left: "12%", delay: 0.6, duration: 10, text: "$142" },
  { top: "58%", left: "6%", delay: 4.2, duration: 9.5, text: "8.4%" },
  { top: "40%", left: "90%", delay: 2, duration: 11.5, text: "$198" },
  { top: "76%", left: "80%", delay: 6, duration: 10.5, text: "2.5%" },
  { top: "12%", left: "70%", delay: 3.2, duration: 9, text: "$167" },
];

function BracketTick({ top, left, width, delay, duration }: (typeof TICKS)[number]) {
  return (
    <motion.svg
      className="absolute text-brand-accent/25"
      style={{ top, left, width, height: 8 }}
      viewBox={`0 0 ${width} 8`}
      fill="none"
      animate={{ opacity: [0, 0.7, 0], x: [0, 12, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <line x1={0} y1={4} x2={width} y2={4} stroke="currentColor" strokeWidth={1} />
      <line x1={0} y1={0} x2={0} y2={8} stroke="currentColor" strokeWidth={1} />
      <line x1={width} y1={0} x2={width} y2={8} stroke="currentColor" strokeWidth={1} />
    </motion.svg>
  );
}

function ValueFragment({ top, left, delay, duration, text }: (typeof FRAGMENTS)[number]) {
  return (
    <motion.span
      className="absolute font-mono text-xs text-foreground/20 tabular-nums"
      style={{ top, left }}
      animate={{ opacity: [0, 0.5, 0], y: [0, -10, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {text}
    </motion.span>
  );
}

export function AmbientField({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className={className}>
      {/* Soft ambient light source, not a panel treatment — no glassmorphism. */}
      <div
        className="absolute top-1/3 left-1/2 -z-10 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--brand-accent) 0%, transparent 70%)" }}
      />
      {prefersReducedMotion
        ? null
        : (
            <>
              {TICKS.map((tick, i) => (
                <BracketTick key={i} {...tick} />
              ))}
              {FRAGMENTS.map((fragment, i) => (
                <ValueFragment key={i} {...fragment} />
              ))}
            </>
          )}
    </div>
  );
}
