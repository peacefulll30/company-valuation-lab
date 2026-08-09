"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { workspaceSections, type WorkspaceSectionSlug } from "@/lib/site-config";

type WorkspaceJourneyContextValue = {
  activeSlug: WorkspaceSectionSlug;
  /** Smooth-scrolls to a section (sidebar click) and optimistically marks it active. */
  scrollToSection: (slug: WorkspaceSectionSlug) => void;
  /** Registers/unregisters a section's DOM node so it can be found by slug (scroll target, IntersectionObserver target). */
  registerSection: (slug: WorkspaceSectionSlug, el: HTMLElement | null) => void;
  /** Jumps to a section instantly (page-load positioning for a deep link) without an animated scroll. */
  focusInitialSection: (slug: WorkspaceSectionSlug) => void;
};

const WorkspaceJourneyContext = createContext<WorkspaceJourneyContextValue | null>(null);

/**
 * Powers the "one continuous valuation story" workspace (brief §6/§7/§9):
 * all 9 sections are mounted together in one scrollable page, and this
 * provider is the shared source of truth for "which one is active" so the
 * sidebar (a sibling of the scrollable content, not an ancestor/descendant
 * of it) can stay in sync — via a real IntersectionObserver watching a
 * thin band near the top of the viewport, never by intercepting scroll
 * input. Sidebar clicks call `scrollToSection`, which is a plain
 * `scrollIntoView` — normal, interruptible browser scrolling the whole
 * way, not a hijacked/animated takeover.
 */
export function WorkspaceJourneyProvider({ companySlug, children }: { companySlug: string; children: ReactNode }) {
  const [activeSlug, setActiveSlug] = useState<WorkspaceSectionSlug>(workspaceSections[0].slug);
  const sectionsRef = useRef(new Map<WorkspaceSectionSlug, HTMLElement>());
  const intersectingRef = useRef(new Map<WorkspaceSectionSlug, boolean>());
  const prefersReducedMotion = useReducedMotion();

  const registerSection = useCallback((slug: WorkspaceSectionSlug, el: HTMLElement | null) => {
    if (el) sectionsRef.current.set(slug, el);
    else sectionsRef.current.delete(slug);
  }, []);

  const focusInitialSection = useCallback((slug: WorkspaceSectionSlug) => {
    setActiveSlug(slug);
    const el = sectionsRef.current.get(slug);
    el?.scrollIntoView({ block: "start" });
  }, []);

  const scrollToSection = useCallback(
    (slug: WorkspaceSectionSlug) => {
      const el = sectionsRef.current.get(slug);
      if (!el) return;
      setActiveSlug(slug);
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    },
    [prefersReducedMotion]
  );

  useEffect(() => {
    // A thin detection band near the top of the viewport: the "active"
    // section is whichever registered section (in document order) is
    // currently crossing that band. This never touches scroll behavior —
    // it only observes.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = entry.target.id as WorkspaceSectionSlug;
          intersectingRef.current.set(slug, entry.isIntersecting);
        }
        const current = workspaceSections.find((section) => intersectingRef.current.get(section.slug));
        if (current) setActiveSlug(current.slug);
      },
      { rootMargin: "-12% 0px -72% 0px", threshold: 0 }
    );

    for (const el of sectionsRef.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const path = `/valuation/${companySlug}/${activeSlug}`;
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.replaceState(window.history.state, "", path);
    }
  }, [activeSlug, companySlug]);

  const value = useMemo(
    () => ({ activeSlug, scrollToSection, registerSection, focusInitialSection }),
    [activeSlug, scrollToSection, registerSection, focusInitialSection]
  );

  return <WorkspaceJourneyContext.Provider value={value}>{children}</WorkspaceJourneyContext.Provider>;
}

export function useWorkspaceJourney(): WorkspaceJourneyContextValue {
  const context = useContext(WorkspaceJourneyContext);
  if (!context) throw new Error("useWorkspaceJourney must be used within a WorkspaceJourneyProvider");
  return context;
}
