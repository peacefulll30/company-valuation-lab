"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Container } from "@/components/brand/container";
import { RangeBracket } from "@/components/brand/range-bracket";
import { InteractiveHoverButton } from "@/components/marketing/interactive-hover-button";
import { AmbientField } from "@/components/marketing/ambient-field";

const EASE = [0.16, 1, 0.3, 1] as const;

// Both rest and hover states read dark text — in the dark shell the resting
// button surface is `--primary` (paper) and the hover sweep is brass, both
// light-toned, so the label stays ink-colored throughout (see
// interactive-hover-button.tsx's prop doc).
const CTA_INK = "#14171f";

const headlineGroups = [
  "What is this company",
  "actually worth —",
  "and how confident should you be?",
];

/**
 * The dominant first screen (Design spec §2 marketing shell): large
 * Fraunces headline, generous space, and the ambient range-bracket field
 * as the "feels alive immediately" motion — everything else about the
 * approved hero contract (copy, stagger timing, CTA behavior) is
 * unchanged.
 */
export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.09,
        delayChildren: prefersReducedMotion ? 0 : 0.15,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.6, ease: EASE },
    },
  };

  return (
    <section className="relative overflow-hidden border-b border-border py-28 sm:py-36 lg:py-44">
      <AmbientField className="pointer-events-none absolute inset-0 -z-10" />

      <Container className="relative flex flex-col items-start gap-9">
        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.4, ease: EASE }}
          className="font-mono text-xs tracking-[0.22em] text-muted-foreground uppercase"
        >
          DCF &middot; WACC &middot; Scenarios &middot; Sensitivity &middot; AI Analyst
        </motion.p>

        <motion.h1
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-4xl font-display text-5xl leading-[1.05] font-medium text-balance sm:text-6xl lg:text-7xl"
        >
          {headlineGroups.map((group, i) => (
            <motion.span key={group} variants={item} className="block">
              {group}
              {i < headlineGroups.length - 1 ? " " : ""}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.01 : 0.5,
            ease: EASE,
            delay: prefersReducedMotion ? 0 : 0.15 + headlineGroups.length * 0.09 + 0.35,
          }}
          className="max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Company Valuation Lab builds a full DCF, WACC, scenario, and sensitivity model
          from real filings — then shows exactly which assumptions are driving the
          answer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.01 : 0.5,
            ease: EASE,
            delay: prefersReducedMotion ? 0 : 0.15 + headlineGroups.length * 0.09 + 0.55,
          }}
          className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10"
        >
          <InteractiveHoverButton href="/valuation" restColor={CTA_INK} hoverColor={CTA_INK} className="h-12 px-7 text-base">
            Start Valuation
          </InteractiveHoverButton>

          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <span>Illustrative example</span>
            <span className="tabular-nums">$142&ndash;$198</span>
            <RangeBracket
              width={72}
              tickHeight={8}
              animateResolve
              className="translate-y-px"
            />
            <span className="text-foreground tabular-nums">$167</span>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
