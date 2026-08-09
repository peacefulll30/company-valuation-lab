"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Container } from "@/components/brand/container";
import { RangeBracket } from "@/components/brand/range-bracket";
import { InteractiveHoverButton } from "@/components/marketing/interactive-hover-button";

const EASE = [0.16, 1, 0.3, 1] as const;

const headlineGroups = [
  "What is this company",
  "actually worth —",
  "and how confident should you be?",
];

/**
 * The approved animated hero (Design spec §2). Copy is specific to this
 * product, not placeholder text. The only motion beyond the entrance
 * sequence is the single range-bracket "resolve" beat after the text
 * settles — deliberately one moment, not an ambient loop.
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
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.55, ease: EASE },
    },
  };

  return (
    <section className="border-b border-border py-20 sm:py-28">
      <Container className="flex flex-col items-start gap-8">
        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.4, ease: EASE }}
          className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase"
        >
          DCF &middot; WACC &middot; Scenarios &middot; Sensitivity &middot; AI Analyst
        </motion.p>

        <motion.h1
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-3xl font-display text-4xl leading-[1.08] font-medium text-balance sm:text-5xl lg:text-6xl"
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
          <InteractiveHoverButton href="/valuation">
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
