"use client";

import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { CompanyContextHeader } from "@/components/valuation/company-context-header";
import { FairValuePanel } from "@/components/valuation/fair-value-panel";

/** Client wrapper: reads the live workspace context and feeds real data into the presentational header. */
export function CompanyContextHeaderLive({ companySlug }: { companySlug: string }) {
  const { record, initialQuote, updateWaccFromPrice } = useValuationWorkspace();
  return (
    <CompanyContextHeader
      companySlug={companySlug}
      data={{ ticker: record.meta.ticker, name: record.meta.name, tier: record.meta.tier }}
      initialQuote={initialQuote}
      onQuoteChange={updateWaccFromPrice}
    />
  );
}

/** Client wrapper: reads the live workspace context and feeds the computed Bear/Base/Bull range into the panel. */
export function FairValuePanelLive({
  className,
  variant,
}: {
  className?: string;
  variant?: "sidebar" | "bar";
}) {
  const { modelState } = useValuationWorkspace();

  if (!modelState) {
    return <FairValuePanel className={className} variant={variant} />;
  }

  const { bear, bull, base } = modelState.scenarios;
  const prices = [bear.impliedSharePrice, base.impliedSharePrice, bull.impliedSharePrice];

  return (
    <FairValuePanel
      className={className}
      variant={variant}
      data={{ base: base.impliedSharePrice, low: Math.min(...prices), high: Math.max(...prices) }}
    />
  );
}
