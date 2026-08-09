import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/brand/container";
import { AppTopBar } from "@/components/valuation/app-top-bar";
import { SiteFooter } from "@/components/marketing/site-footer";

type UnavailableStatus = "not-found" | "unsupported" | "insufficient-data" | "network-error";

const COPY: Record<UnavailableStatus, { title: string; body: string }> = {
  "not-found": {
    title: "No match found",
    body: "We couldn't find a SEC-registered company matching this. Try the ticker symbol, or check the spelling.",
  },
  unsupported: {
    title: "Not supported in this model",
    body: "This looks like a bank, insurer, or other financial institution. The DCF/EBITDA methodology here doesn't fit financial institutions, so they're excluded by design — not a data error.",
  },
  "insufficient-data": {
    title: "Not enough reliable data",
    body: "This is a supported, non-financial company, but we couldn't retrieve enough complete, reliable financial data from SEC filings to build a full five-year model yet.",
  },
  "network-error": {
    title: "Couldn't reach SEC EDGAR",
    body: "This is usually temporary — SEC's data service may be briefly unavailable. Try again in a moment.",
  },
};

/**
 * Terminal state for a `companySlug` that didn't resolve (Phase 5) — a
 * defensive fallback for direct/bookmarked/shared URLs, distinct from the
 * primary search flow's own inline errors on `/valuation` (CLAUDE.md —
 * "the Company Selection page is the only place eligibility failures
 * surface" governs the search flow itself; this is what a stale or
 * tampered URL gets instead of a broken, partially-populated workspace).
 */
export function CompanyUnavailable({
  status,
  reason,
  companySlug,
}: {
  status: UnavailableStatus;
  reason: string;
  companySlug: string;
}) {
  const copy = COPY[status];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar />
      <main id="main-content" className="flex-1 py-16">
        <Container className="max-w-xl">
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{companySlug}</p>
          <h1 className="mt-1 font-display text-2xl font-medium sm:text-3xl">{copy.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{copy.body}</p>
          <p role="status" className="mt-2 font-mono text-xs text-muted-foreground">
            {reason}
          </p>
          <Link
            href="/valuation"
            className="mt-6 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium outline-none hover:text-brand-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to search
          </Link>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
