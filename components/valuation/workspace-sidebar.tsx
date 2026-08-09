"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { workspaceSections } from "@/lib/site-config";
import { useWorkspaceJourney } from "@/components/valuation/workspace-journey-context";

type WorkspaceSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  variant?: "full" | "icon";
  /**
   * Scopes the animated active-indicator's `layoutId`. Several
   * `WorkspaceSidebar` instances can be mounted at once (the desktop
   * full + icon rails, plus the mobile bottom-sheet copy while it's
   * open) — a shared `layoutId` across concurrently-mounted instances is
   * ambiguous to Framer Motion, so each call site needs its own scope.
   * Defaults to `variant`, which is only safe when a caller knows no
   * other instance with the same variant can be mounted at the same time
   * (not true for the mobile sheet, which explicitly overrides this).
   */
  indicatorScope?: string;
};

/**
 * The persistent section rail (Design spec §3, brief §9) — tracks scroll
 * position within the single continuous workspace page (via
 * `WorkspaceJourneyProvider`, not a route match) and lets a click
 * smooth-scroll to any section. Three visual states per row: active
 * (illuminated, brass indicator), passed (subdued but readable), upcoming
 * (lower emphasis) — encoding where the user is in the story, not just
 * which tab they're "on."
 */
export function WorkspaceSidebar({ className, onNavigate, variant = "full", indicatorScope }: WorkspaceSidebarProps) {
  const { activeSlug, scrollToSection } = useWorkspaceJourney();
  const isIcon = variant === "icon";
  const scope = indicatorScope ?? variant;
  const activeIndex = workspaceSections.findIndex((section) => section.slug === activeSlug);

  return (
    <nav aria-label="Valuation workspace sections" className={className}>
      <ul className="flex flex-col">
        {workspaceSections.map((section, i) => {
          const isActive = i === activeIndex;
          const isPassed = i < activeIndex;
          return (
            <li key={section.slug} className="relative">
              {isActive ? (
                <motion.span
                  layoutId={`workspace-sidebar-indicator-${scope}`}
                  className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-brand-accent shadow-[0_0_10px_var(--brand-glow)]"
                  transition={{ type: "spring", stiffness: 400, damping: 38 }}
                />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  scrollToSection(section.slug);
                  onNavigate?.();
                }}
                aria-current={isActive ? "true" : undefined}
                title={isIcon ? section.label : undefined}
                className={cn(
                  "flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-sm outline-none transition-colors duration-200",
                  "hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isIcon && "justify-center px-2",
                  isActive && "bg-accent/60"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums transition-colors duration-200",
                    isActive ? "text-brand-accent" : isPassed ? "text-brand-accent/45" : "text-muted-foreground"
                  )}
                >
                  {section.step}
                </span>
                <span
                  className={cn(
                    "transition-colors duration-200",
                    isIcon && "sr-only",
                    isActive ? "font-medium text-foreground" : isPassed ? "text-foreground/65" : "text-muted-foreground"
                  )}
                >
                  {section.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
