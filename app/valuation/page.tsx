import type { Metadata } from "next";
import { Container } from "@/components/brand/container";
import { AppTopBar } from "@/components/valuation/app-top-bar";
import { CompanySearch } from "@/components/valuation/company-search";
import { FeaturedCompanies } from "@/components/valuation/featured-companies";
import { AmbientField } from "@/components/marketing/ambient-field";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Select a company — Company Valuation Lab",
};

/**
 * The Start Valuation / company-selection entry screen — dark premium
 * shell (Design spec §2 marketing-shell scope), same `.dark` token set as
 * the landing page. Purely visual: search/Featured logic, routes, and
 * every eligibility rule are unchanged from Phase 5.
 */
export default function CompanySelectionPage() {
  return (
    <div className="dark flex min-h-full flex-1 flex-col bg-background text-foreground">
      <AppTopBar />
      <main id="main-content" className="relative flex-1 overflow-hidden py-16 sm:py-24">
        <AmbientField className="pointer-events-none absolute inset-0 -z-10" />
        <Container className="flex flex-col gap-14">
          <div className="max-w-2xl">
            <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">Start valuation</p>
            <h1 className="mt-3 font-display text-5xl font-medium text-balance sm:text-6xl">
              Select a company
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Search any public operating company, or pick from the Featured list below —
              verified by hand to always work.
            </p>
          </div>

          <CompanySearch />

          <FeaturedCompanies />
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
