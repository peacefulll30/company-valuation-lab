"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Container } from "@/components/brand/container";
import { IlluminatedButton } from "@/components/marketing/illuminated-button";
import { AmbientField } from "@/components/marketing/ambient-field";
import { ValuationEngineVisual } from "@/components/marketing/valuation-engine-visual";

const EASE = [0.16, 1, 0.3, 1] as const;

const headlineGroups = [
  "What is this company",
  "actually worth —",
  "and how confident should you be?",
];

/**
 * The dominant first screen (Design spec §2 marketing shell). The right
 * column is an abstract "a valuation model is running" visual, not a fake
 * price — the previous "Illustrative example $142–$198 → $167" numbers
 * are gone entirely; nothing on this screen should read as belonging to a
 * real company (that's what the actual workspace computes).
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
    <section className="relative overflow-hidden border-b border-border py-16 sm:py-20 lg:py-24">
      <AmbientField className="pointer-events-none absolute inset-0 -z-10" />

      <Container className="relative grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
        <div className="flex flex-col items-start gap-9">
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
            className="max-w-2xl font-display text-5xl leading-[1.05] font-medium text-balance sm:text-6xl"
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
          >
            <IlluminatedButton href="/valuation" size="lg">
              Start Valuation
            </IlluminatedButton>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.9, delay: prefersReducedMotion ? 0 : 0.4, ease: EASE }}
          className="relative hidden aspect-[27/16] w-full max-w-2xl justify-self-center lg:block"
        >
          <ValuationEngineVisual className="size-full" />
        </motion.div>
      </Container>
    </section>
  );
}
