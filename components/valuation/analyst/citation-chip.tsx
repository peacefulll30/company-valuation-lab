import Link from "next/link";
import type { CitationUnit } from "@/lib/ai/citations";
import { formatCompactCurrency, formatCurrency, formatMultiple, formatPercent } from "@/lib/format";

function formatCitationValue(unit: CitationUnit, value: number): string {
  switch (unit) {
    case "currency":
      return formatCurrency(value);
    case "compactCurrency":
      return formatCompactCurrency(value);
    case "percent":
      return formatPercent(value);
    case "multiple":
      return formatMultiple(value);
    case "plain":
      return value.toLocaleString("en-US");
  }
}

/**
 * The literal UI expression of PRD FR-51 (Design spec §6): a number the AI
 * cites renders as a bordered mono chip pulled from the live model state,
 * never as plain prose digits. Links to the tab that number lives on.
 */
export function CitationChip({
  companySlug,
  label,
  tab,
  unit,
  value,
}: {
  companySlug: string;
  label: string;
  tab: string;
  unit: CitationUnit;
  value: number;
}) {
  return (
    <Link
      href={`/valuation/${companySlug}/${tab}`}
      title={label}
      className="mx-0.5 inline-flex items-center gap-1 rounded-sm border border-border bg-card px-1.5 py-0.5 align-baseline font-mono text-[13px] tabular-nums text-foreground no-underline outline-none hover:border-brand-accent hover:text-brand-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
    >
      {formatCitationValue(unit, value)}
    </Link>
  );
}

/** Non-clickable fallback for a citation key the model referenced that isn't (or is no longer) resolvable — never a broken/blank chip. */
export function UnresolvedCitation({ citationKey }: { citationKey: string }) {
  return (
    <span
      title={`Reference "${citationKey}" isn't available in the current model state.`}
      className="mx-0.5 inline-flex items-center rounded-sm border border-dashed border-muted-foreground/40 px-1.5 py-0.5 align-baseline font-mono text-[13px] text-muted-foreground"
    >
      {citationKey}
    </span>
  );
}
