import type { Metadata } from "next";
import { Container } from "@/components/brand/container";
import { AppTopBar } from "@/components/valuation/app-top-bar";
import { CompanyContextHeaderLive, FairValuePanelLive } from "@/components/valuation/workspace-live";
import { CompanyUnavailable } from "@/components/valuation/company-unavailable";
import { WorkspaceSidebar } from "@/components/valuation/workspace-sidebar";
import { MobileWorkspaceNav } from "@/components/valuation/mobile-workspace-nav";
import { getFeaturedCompany, featuredSlugs } from "@/lib/featured";
import { buildDefaultAssumptions } from "@/lib/featured/defaultAssumptions";
import { ValuationWorkspaceProvider } from "@/lib/featured/ValuationWorkspaceContext";
import { resolveWorkspaceCompany } from "@/lib/data/workspaceCompany";

export function generateStaticParams() {
  return featuredSlugs.map((companySlug) => ({ companySlug }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/valuation/[companySlug]">): Promise<Metadata> {
  const { companySlug } = await params;
  const record = getFeaturedCompany(companySlug);
  return {
    title: `${record?.meta.ticker ?? companySlug.toUpperCase()} — Company Valuation Lab`,
  };
}

/**
 * The workspace shell (Design spec §3): left sidebar rail on desktop, an
 * icon rail on tablet, a bottom-sheet nav on mobile — and a persistent Fair
 * Value stat that lives in the sidebar footer on desktop and slides into a
 * sticky bottom bar everywhere narrower.
 *
 * Default Assumptions are computed once here (server-side, from the
 * company's own historicals + the shared market-assumption defaults) and
 * handed to a client `ValuationWorkspaceProvider`, which owns live
 * assumption edits and recomputes the full model via the pure engine — no
 * route handler needed. A slug that doesn't resolve (Featured or Search)
 * gets a clear terminal state, never a broken/partial workspace.
 */
export default async function CompanyWorkspaceLayout({
  children,
  params,
}: LayoutProps<"/valuation/[companySlug]">) {
  const { companySlug } = await params;
  const resolution = await resolveWorkspaceCompany(companySlug);

  if ("error" in resolution) {
    return (
      <CompanyUnavailable status={resolution.error.status} reason={resolution.error.reason} companySlug={companySlug} />
    );
  }

  const { record } = resolution;
  const { assumptions, waccExplanation } = buildDefaultAssumptions(record.financials);

  return (
    <ValuationWorkspaceProvider record={record} defaultAssumptions={assumptions} waccExplanation={waccExplanation}>
      <div className="flex min-h-full flex-1 flex-col">
        <AppTopBar />
        <CompanyContextHeaderLive companySlug={companySlug} />

        <div className="flex flex-1 flex-col md:flex-row">
          <aside className="hidden shrink-0 flex-col border-r border-border md:flex md:w-14 lg:w-60">
            <WorkspaceSidebar
              companySlug={companySlug}
              variant="full"
              className="hidden flex-1 py-4 lg:block"
            />
            <WorkspaceSidebar
              companySlug={companySlug}
              variant="icon"
              className="flex-1 py-4 lg:hidden"
            />
            <FairValuePanelLive className="hidden border-t border-border lg:block" />
          </aside>

          <div className="flex flex-1 flex-col">
            <div className="border-b border-border py-3 md:hidden">
              <Container>
                <MobileWorkspaceNav companySlug={companySlug} />
              </Container>
            </div>

            <main id="main-content" className="flex-1 pb-20 lg:pb-0">
              <Container className="py-10">{children}</Container>
            </main>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background lg:hidden">
          <FairValuePanelLive variant="bar" />
        </div>
      </div>
    </ValuationWorkspaceProvider>
  );
}
