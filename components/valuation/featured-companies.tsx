import Link from "next/link";
import { listFeaturedCompanies } from "@/lib/featured";

type FeaturedCompaniesProps = {
  /** "preview" = a shorter strip for the Landing page; "full" = the Company Selection grid. */
  variant?: "preview" | "full";
  className?: string;
};

/**
 * The Featured / Guaranteed companies grid (PRD §5, §7.2), now backed by
 * the real, SEC-sourced, schema-validated `/data/featured/*.json` records
 * (Phase 4) — each card links straight into that company's workspace.
 */
export function FeaturedCompanies({ variant = "full", className }: FeaturedCompaniesProps) {
  const companies = listFeaturedCompanies();
  const shown = variant === "preview" ? companies.slice(0, 6) : companies;

  return (
    <div className={className}>
      <p className="font-mono text-xs text-muted-foreground">
        Featured / Guaranteed &mdash; {companies.length} companies, verified by hand
      </p>
      <div
        role="list"
        className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3 lg:grid-cols-5"
      >
        {shown.map((company) => (
          <Link
            role="listitem"
            key={company.meta.ticker}
            href={`/valuation/${company.meta.ticker.toLowerCase()}/overview`}
            className="flex flex-col gap-1.5 bg-card p-4 outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span className="font-mono text-xs text-muted-foreground">{company.meta.ticker}</span>
            <span className="text-sm">{company.meta.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
