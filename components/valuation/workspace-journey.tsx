"use client";

import { useLayoutEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { workspaceSections, type WorkspaceSectionSlug } from "@/lib/site-config";
import { useWorkspaceJourney } from "@/components/valuation/workspace-journey-context";
import { OverviewTab } from "@/components/valuation/tabs/overview-tab";
import { HistoricalsTab } from "@/components/valuation/tabs/historicals-tab";
import { ForecastTab } from "@/components/valuation/tabs/forecast-tab";
import { DcfTab } from "@/components/valuation/tabs/dcf-tab";
import { ScenariosTab } from "@/components/valuation/tabs/scenarios-tab";
import { SensitivityTab } from "@/components/valuation/tabs/sensitivity-tab";
import { CompsTab } from "@/components/valuation/tabs/comps-tab";
import { SummaryTab } from "@/components/valuation/tabs/summary-tab";
import { AnalystTab } from "@/components/valuation/tabs/analyst-tab";

const EASE = [0.16, 1, 0.3, 1] as const;

const SECTION_CONTENT: Record<WorkspaceSectionSlug, React.ComponentType> = {
  overview: OverviewTab,
  historicals: HistoricalsTab,
  forecast: ForecastTab,
  dcf: DcfTab,
  scenarios: ScenariosTab,
  sensitivity: SensitivityTab,
  comps: CompsTab,
  summary: SummaryTab,
  analyst: AnalystTab,
};

/**
 * The single continuous workspace page (brief §6/§7) — all 9 sections
 * mounted together in document order, each addressable by id. A route
 * like `/valuation/aapl/dcf` still lands the user exactly at DCF: on
 * mount this jumps (no animation — this is page-load positioning, not a
 * user-triggered navigation) to `initialSlug`, then normal scrolling and
 * `WorkspaceJourneyProvider`'s IntersectionObserver take over from there.
 */
export function WorkspaceJourney({ initialSlug }: { initialSlug: WorkspaceSectionSlug }) {
  const { focusInitialSection } = useWorkspaceJourney();
  const hasFocused = useRef(false);

  // A layout effect, not a regular effect: it must resolve the correct
  // scroll position *before* the browser paints the first frame, so
  // `whileInView` reveals (in `JourneySection` below) evaluate visibility
  // at the final, jumped-to position rather than briefly at the top of
  // the page — the difference between an instant, correct landing and a
  // one-frame flash of the wrong sections fading in.
  useLayoutEffect(() => {
    if (hasFocused.current) return;
    hasFocused.current = true;
    focusInitialSection(initialSlug);
    // Only ever runs once per full page load — sidebar clicks and scroll
    // never remount this component, so this must not re-fire on an
    // `initialSlug` identity change that doesn't actually correspond to a
    // fresh navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col">
      {workspaceSections.map((section) => {
        const Content = SECTION_CONTENT[section.slug];
        return (
          <JourneySection key={section.slug} slug={section.slug}>
            <Content />
          </JourneySection>
        );
      })}
    </div>
  );
}

function JourneySection({ slug, children }: { slug: WorkspaceSectionSlug; children: React.ReactNode }) {
  const { registerSection } = useWorkspaceJourney();
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // A layout effect so registration completes before `WorkspaceJourney`'s
  // own layout effect (the parent) runs in the same commit — React fires
  // layout effects bottom-up, so this ordering is guaranteed, unlike
  // mixing a child's passive `useEffect` with a parent's `useLayoutEffect`
  // (which would fire the parent first and find nothing registered yet).
  useLayoutEffect(() => {
    registerSection(slug, ref.current);
    return () => registerSection(slug, null);
  }, [slug, registerSection]);

  return (
    <motion.section
      id={slug}
      ref={ref}
      className="scroll-mt-20 relative border-b border-border py-12 last:border-none sm:py-16"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {/* A soft illumination that arrives with the section — the "one continuous story" cue
          echoing the marketing shell's ambient glow, not a per-section spotlight that would
          fight the content for attention. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-0 -z-10 h-40 w-72 opacity-0"
        style={{ background: "radial-gradient(circle, var(--brand-glow, var(--brand-accent)) 0%, transparent 72%)" }}
        initial={prefersReducedMotion ? { opacity: 0.05 } : { opacity: 0 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 0.08 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 1.1, ease: EASE }}
      />
      {/* A thin brass rule that draws in above the section — the "arriving" cue for the story. */}
      <motion.span
        aria-hidden="true"
        className="absolute top-0 left-0 h-px w-16 origin-left bg-brand-accent"
        initial={prefersReducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={prefersReducedMotion ? undefined : { scaleX: 1 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
      />
      {children}
    </motion.section>
  );
}
