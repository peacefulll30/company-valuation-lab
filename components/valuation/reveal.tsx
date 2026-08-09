"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * A small, reusable "this content just arrived" wrapper (V1.3 — workspace
 * section-to-section transitions) — used inside each tab to stagger the
 * body in slightly after `JourneySection`'s own heading reveal, so a
 * section reads as "settling into place" rather than popping in as one
 * flat block. Deliberately generic: it doesn't know or care what's
 * inside it (a table, a chart grid, a form) — no chart internals or
 * financial logic touched.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
