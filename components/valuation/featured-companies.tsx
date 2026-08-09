"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { listFeaturedCompanies } from "@/lib/featured";
import { CompanyMonogram } from "@/components/marketing/company-monogram";
import { cn } from "@/lib/utils";

type FeaturedCompaniesProps = {
  className?: string;
  /** Adds a light stagger-in on mount — used once per page, not on repeat renders (e.g. `/valuation`'s list stays static). */
  animateIn?: boolean;
};

/**
 * The Featured / Guaranteed companies grid (PRD §5, §7.2) — all 10, every
 * time (no preview slice). Institutional, mostly monochrome cards (Design
 * spec §2 brief): dark surface, refined border, a real or monogram mark,
 * subtle elevation and illumination on hover/focus.
 */
export function FeaturedCompanies({ className, animateIn = false }: FeaturedCompaniesProps) {
  const prefersReducedMotion = useReducedMotion();
  const companies = listFeaturedCompanies();

  return (
    <div className={className}>
      <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
        Featured &mdash; {companies.length} companies, verified by hand
      </p>
      <div role="list" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {companies.map((company, i) => (
          <motion.div
            key={company.meta.ticker}
            role="listitem"
            initial={animateIn && !prefersReducedMotion ? { opacity: 0, y: 12 } : false}
            whileInView={animateIn && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: (i % 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
            whileHover={prefersReducedMotion ? undefined : { y: -3 }}
          >
            <Link
              href={`/valuation/${company.meta.ticker.toLowerCase()}/overview`}
              className={cn(
                "group relative flex h-full flex-col gap-5 rounded-xl border border-white/8 bg-card p-5 outline-none",
                "transition-[border-color,box-shadow] duration-300",
                "hover:border-brand-accent/40 hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--brand-accent)_25%,transparent),0_18px_36px_-24px_var(--brand-glow)]",
                "focus-visible:border-brand-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <motion.div whileHover={prefersReducedMotion ? undefined : { rotate: -4, scale: 1.05 }} transition={{ duration: 0.25 }}>
                  <CompanyMonogram ticker={company.meta.ticker} />
                </motion.div>
                <ArrowUpRight
                  className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-accent group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">{company.meta.ticker}</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{company.meta.name}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
