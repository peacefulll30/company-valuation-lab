"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type SharedProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "lg";
};

type IlluminatedButtonProps = SharedProps &
  ({ href: string; onClick?: never; disabled?: never } | { href?: never; onClick: () => void; disabled?: boolean });

/**
 * The single shared CTA treatment (Design spec §2, "Apple-like interaction
 * quality"): a dark graphite surface at rest, crisp white label, a
 * restrained brass border that lights up on hover/focus, an internal light
 * sweep, and a small depth response — never a separately-colored block
 * beside or behind the label.
 *
 * The previous version's brass hover-fill was a sibling layer translated
 * off-screen (`x: "-101%"`) with no `overflow-hidden` on its container —
 * it rendered as a genuinely separate floating rectangle next to the
 * button whenever anything sat near it. This version clips the sweep to
 * the button's own rounded bounds (`overflow-hidden` on the outer
 * element) so there is exactly one cohesive shape at all times.
 */
export function IlluminatedButton(props: IlluminatedButtonProps) {
  const { children, className, size = "default" } = props;
  const [active, setActive] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const sharedClassName = cn(
    "group relative isolate inline-flex items-center overflow-hidden rounded-full border border-white/12 bg-primary text-primary-foreground outline-none",
    "transition-[border-color,box-shadow,transform] duration-300 ease-out",
    "hover:border-brand-accent/55 focus-visible:border-brand-accent/55",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-80",
    size === "lg" ? "h-14 px-8 text-base" : "h-12 px-6 text-sm",
    active ? "shadow-[0_0_0_1px_color-mix(in_srgb,var(--brand-accent)_35%,transparent),0_0_28px_-6px_var(--brand-glow)]" : "shadow-none",
    className
  );

  const inner = (
    <>
      {/* Internal light sweep — a skewed, blurred bar translating across, clipped to the button's own rounded bounds. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={false}
        animate={{ x: active ? "340%" : "-40%" }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.65, ease: EASE }}
      />
      <span className="relative z-10 inline-flex w-full items-center justify-center gap-2.5 font-medium tracking-wide">
        {children}
        <motion.span
          className={cn("inline-flex transition-colors duration-300", active && "text-brand-accent")}
          initial={false}
          animate={{ x: active ? 3 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: EASE }}
        >
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </motion.span>
      </span>
    </>
  );

  const handlers = {
    onMouseEnter: () => setActive(true),
    onMouseLeave: () => setActive(false),
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
  };

  const motionProps = {
    whileHover: prefersReducedMotion ? undefined : { scale: 1.015 },
    whileTap: prefersReducedMotion ? undefined : { scale: 0.985 },
    transition: { duration: 0.2, ease: EASE },
  };

  if ("href" in props && props.href) {
    return (
      <motion.div className="inline-block" {...motionProps}>
        <Link href={props.href} className={sharedClassName} {...handlers}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={sharedClassName}
      {...handlers}
      {...motionProps}
    >
      {inner}
    </motion.button>
  );
}
