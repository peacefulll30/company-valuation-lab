import type { Metadata } from "next";
import { AppTopBar } from "@/components/valuation/app-top-bar";
import { CompanyContextHeaderLive } from "@/components/valuation/workspace-live";
import { CompanyUnavailable } from "@/components/valuation/company-unavailable";
import { WorkspaceShell } from "@/components/valuation/workspace-shell";
import { getFeaturedCompany, featuredSlugs } from "@/lib/featured";
import { buildDefaultAssumptions } from "@/lib/featured/defaultAssumptions";
import { ValuationWorkspaceProvider } from "@/lib/featured/ValuationWorkspaceContext";
import { resolveWorkspaceCompany } from "@/lib/data/workspaceCompany";
import type { CompanyWorkspaceRecord } from "@/lib/data/types";
import { fetchQuote } from "@/lib/market/twelveData";

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
 * The workspace shell (Design spec §3, V1.2 dark pass) — left sidebar rail
 * on desktop, an icon rail on tablet, a bottom-sheet nav on mobile — and a
 * persistent Fair Value stat that lives in the sidebar footer on desktop
 * and slides into a sticky bottom bar everywhere narrower. The dark,
 * near-black treatment (previously scoped to the marketing shell only —
 * see the `.dark` block comment in `app/globals.css`) now extends here
 * too: every value below reads from semantic tokens (`bg-card`,
 * `text-foreground`, `var(--chart-1)`, …), so wrapping the tree in `.dark`
 * re-themes the whole workspace, charts included, with no per-component
 * changes needed.
 *
 * `children` is one of the 9 tab routes, each of which renders
 * `<WorkspaceJourney initialSlug="…">` — the actual content for ALL 9
 * sections, composited into one continuous scrollable page inside
 * `WorkspaceShell`. The route still matters (it's what tells the journey
 * which section to land on, and keeps every tab a real, addressable URL),
 * it just no longer corresponds to a full page swap once loaded.
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
      <div className="dark flex min-h-full flex-1 flex-col bg-background text-foreground">
        <CompanyUnavailable status={resolution.error.status} reason={resolution.error.reason} companySlug={companySlug} />
      </div>
    );
  }

  const { record } = resolution;

  // Fetched here (server-side, ISR-cached inside `fetchQuote` — see its own
  // comment) rather than client-side: this value feeds the WACC weighting
  // below, which must be resolved before `assumptions` is built, and the
  // Overview tab reads it straight off `record` via the shared workspace
  // context rather than re-fetching. Never fabricated: `null` on any
  // failure, which every consumer treats as "unavailable," not a guess.
  const priceResult = await fetchQuote(record.meta.ticker);
  const currentPrice = priceResult.status === "ok" ? priceResult.quote : null;

  const recordWithPrice: CompanyWorkspaceRecord = currentPrice
    ? {
        ...record,
        financials: {
          ...record.financials,
          currentPrice: { value: currentPrice.price, source: currentPrice.source, asOf: currentPrice.asOf },
        },
      }
    : record;

  const { assumptions, waccExplanation, taxRateExplanation } = buildDefaultAssumptions(
    recordWithPrice.financials,
    currentPrice
  );

  return (
    <div className="dark flex min-h-full flex-1 flex-col bg-background text-foreground">
      <ValuationWorkspaceProvider
        record={recordWithPrice}
        defaultAssumptions={assumptions}
        waccExplanation={waccExplanation}
        taxRateExplanation={taxRateExplanation}
        initialQuote={priceResult}
      >
        <div className="flex min-h-full flex-1 flex-col">
          <AppTopBar />
          <CompanyContextHeaderLive companySlug={companySlug} />
          <WorkspaceShell companySlug={companySlug}>{children}</WorkspaceShell>
        </div>
      </ValuationWorkspaceProvider>
    </div>
  );
}
