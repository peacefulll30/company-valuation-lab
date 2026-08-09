"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type InteractiveHoverButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

const EASE = [0.16, 1, 0.3, 1] as const;

// Concrete hex values mirroring the --foreground / --primary-foreground
// tokens (app/globals.css) — Framer Motion needs resolvable colors to
// interpolate between, not var() references.
const INK = "#14171f";
const PAPER = "#f7f5f1";

/**
 * The approved InteractiveHoverButton-style CTA (Design spec §2): flat
 * ink-filled at rest, a brass fill sweeps in left-to-right on hover/focus
 * while an arrow slides in — fast and precise, not bouncy. Hover and
 * keyboard focus produce the identical treatment.
 */
export function InteractiveHoverButton({
  href,
  children,
  className,
}: InteractiveHoverButtonProps) {
  const [active, setActive] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.18;

  return (
    <Link
      href={href}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className={cn(
        "group relative isolate inline-flex h-11 items-center rounded-md border border-primary bg-primary px-6 text-sm font-medium outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <motion.span
        className="absolute inset-0 -z-10 rounded-[inherit] bg-brand-accent"
        initial={false}
        animate={{ x: active ? "0%" : "-101%" }}
        transition={{ duration, ease: EASE }}
        aria-hidden="true"
      />
      <motion.span
        className="inline-flex items-center"
        initial={false}
        animate={{ x: active ? -6 : 0, color: active ? INK : PAPER }}
        transition={{ duration, ease: EASE }}
      >
        {children}
      </motion.span>
      <motion.span
        className="inline-flex items-center justify-end overflow-hidden"
        initial={false}
        animate={{
          width: active ? 20 : 0,
          marginLeft: active ? 8 : 0,
          opacity: active ? 1 : 0,
          color: active ? INK : PAPER,
        }}
        transition={{ duration, ease: EASE }}
        aria-hidden="true"
      >
        <ArrowRight className="size-4 shrink-0" />
      </motion.span>
    </Link>
  );
}
