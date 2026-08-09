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
 * time (no preview slice; the Design spec's landing rewrite surfaces the
 * full set immediately). Backed by the real, SEC-sourced, schema-validated
 * `/data/featured/*.json` records.
 */
export function FeaturedCompanies({ className, animateIn = false }: FeaturedCompaniesProps) {
  const prefersReducedMotion = useReducedMotion();
  const companies = listFeaturedCompanies();

  return (
    <div className={className}>
      <p className="font-mono text-xs text-muted-foreground">
        Featured / Guaranteed &mdash; {companies.length} companies, verified by hand
      </p>
      <div role="list" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {companies.map((company, i) => (
          <motion.div
            key={company.meta.ticker}
            role="listitem"
            initial={animateIn && !prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            whileInView={animateIn && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: (i % 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={`/valuation/${company.meta.ticker.toLowerCase()}/overview`}
              className={cn(
                "group flex h-full flex-col gap-3 rounded-md border border-border bg-card p-4 outline-none transition-colors",
                "hover:border-brand-accent/50 hover:bg-accent focus-visible:border-brand-accent/50 focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <CompanyMonogram ticker={company.meta.ticker} />
                <ArrowUpRight
                  className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:opacity-100"
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
