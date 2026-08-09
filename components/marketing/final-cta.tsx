"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/brand/container";

const EASE = [0.16, 1, 0.3, 1] as const;
const CTA_INK = "#14171f";
const TRANSITION_MS = 820;

// Fixed angles (not random) for the dispersion burst — this only ever
// mounts client-side after a click, so hydration isn't the concern; the
// point is a controlled, repeatable, premium-feeling burst rather than a
// noisy one.
const BURST_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/**
 * The landing page's closing moment (Design spec §2): a large "Ready to
 * value a company?" CTA that, on activation, plays a short (~800ms)
 * dispersion transition and a calm "Enjoy the analysis." beat before
 * routing into `/valuation` — never a substitute for real loading state,
 * purely a felt-quality moment on top of an already-fast navigation.
 */
export function FinalCta() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);
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
    <section className="relative overflow-hidden py-32 sm:py-40">
      <Container className="flex flex-col items-center gap-10 text-center">
        <h2 className="max-w-2xl font-display text-4xl font-medium text-balance sm:text-5xl lg:text-6xl">
          Ready to value a company?
        </h2>
        <button
          type="button"
          onClick={handleActivate}
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          disabled={transitioning}
          className="group relative isolate inline-flex h-14 items-center rounded-md border border-primary bg-primary px-9 text-sm font-medium tracking-[0.14em] uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-90"
        >
          <motion.span
            className="absolute inset-0 -z-10 rounded-[inherit] bg-brand-accent"
            initial={false}
            animate={{ x: active || transitioning ? "0%" : "-101%" }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: EASE }}
            aria-hidden="true"
          />
          <motion.span
            className="inline-flex items-center"
            initial={false}
            animate={{ x: active || transitioning ? -6 : 0, color: CTA_INK }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: EASE }}
          >
            Start Valuation
          </motion.span>
          <motion.span
            className="inline-flex items-center justify-end overflow-hidden"
            initial={false}
            animate={{
              width: active || transitioning ? 22 : 0,
              marginLeft: active || transitioning ? 10 : 0,
              opacity: active || transitioning ? 1 : 0,
              color: CTA_INK,
            }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: EASE }}
            aria-hidden="true"
          >
            <ArrowRight className="size-4 shrink-0" />
          </motion.span>
        </button>
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
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}
