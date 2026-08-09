import type { Metadata } from "next";
import { Container } from "@/components/brand/container";
import { AppTopBar } from "@/components/valuation/app-top-bar";
import { CompanySearch } from "@/components/valuation/company-search";
import { FeaturedCompanies } from "@/components/valuation/featured-companies";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Select a company — Company Valuation Lab",
};

export default function CompanySelectionPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar />
      <main id="main-content" className="flex-1 py-12 sm:py-16">
        <Container className="flex flex-col gap-10">
          <div>
            <h1 className="font-display text-3xl font-medium sm:text-4xl">
              Select a company
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Search any public operating company, or pick from the Featured list
              below — verified by hand to always work.
            </p>
          </div>

          <CompanySearch />

          <FeaturedCompanies variant="full" />
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
