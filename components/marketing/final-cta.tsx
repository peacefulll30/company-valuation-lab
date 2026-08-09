"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/brand/container";
import { RangeBracket } from "@/components/brand/range-bracket";
import { AmbientField } from "@/components/marketing/ambient-field";
import { IlluminatedButton } from "@/components/marketing/illuminated-button";

const EASE = [0.16, 1, 0.3, 1] as const;
const TRANSITION_MS = 780;

// Fixed angles (not random) for the dispersion burst — this only ever
// mounts client-side after a click, so hydration isn't the concern; the
// point is a controlled, repeatable, premium-feeling burst rather than a
// noisy one.
const BURST_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/**
 * The landing page's real finale (Design spec §2, brief §7) — a
 * full-screen cinematic close, not a cramped afterthought section. On
 * activation it plays a short (<1s) brass dispersion and a calm "Enjoy
 * the analysis." beat before routing into `/valuation` — never a
 * substitute for real loading state, purely a felt-quality moment on top
 * of an already-fast navigation.
 */
export function FinalCta() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [transitioning, setTransitioning] = useState(false);

  function handleActivate() {
    if (prefersReducedMotion) {
      router.push("/valuation");
      return;
    }
    setTransitioning(true);
    window.setTimeout(() => router.push("/valuation"), TRANSITION_MS);
  }

  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden py-24">
      <AmbientField className="pointer-events-none absolute inset-0 -z-10" />
      <RangeBracket
        width={520}
        tickHeight={64}
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 text-brand-accent/[0.07]"
      />

      <Container className="flex flex-col items-center gap-10 text-center">
        <p className="font-mono text-xs tracking-[0.28em] text-brand-accent uppercase">
          The model is ready
        </p>
        <h2 className="max-w-3xl font-display text-5xl font-medium text-balance sm:text-6xl lg:text-7xl">
          Ready to value a company?
        </h2>
        <IlluminatedButton onClick={handleActivate} disabled={transitioning} size="lg" className="mt-2 px-10 uppercase">
          Start Valuation
        </IlluminatedButton>
      </Container>

      <AnimatePresence>
        {transitioning ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background"
          >
            <DispersionBurst />
            <p className="font-display text-2xl text-foreground italic">Enjoy the analysis.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function DispersionBurst() {
  return (
    <div aria-hidden="true" className="relative size-2">
      {BURST_ANGLES.map((angle) => (
        <motion.span
          key={angle}
          className="absolute top-1/2 left-1/2 size-1 rounded-full bg-brand-accent"
          initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
          animate={{
            x: Math.cos((angle * Math.PI) / 180) * 70,
            y: Math.sin((angle * Math.PI) / 180) * 70,
            opacity: 0,
            scale: 0.4,
          }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      ))}
    </div>
  );
}
