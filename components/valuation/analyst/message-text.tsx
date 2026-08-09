import { Fragment } from "react";
import { resolveCitation, splitCitationTokens } from "@/lib/ai/citations";
import type { ValuationModelState } from "@/lib/engine/results";
import { CitationChip, UnresolvedCitation } from "./citation-chip";

/** Renders assistant prose with `{{cite:KEY}}` tokens swapped for live-data chips (never the model's own digits). */
export function AnalystMessageText({
  text,
  modelState,
  companySlug,
}: {
  text: string;
  modelState: ValuationModelState | null;
  companySlug: string;
}) {
  const segments = splitCitationTokens(text);

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }
        const resolved = modelState ? resolveCitation(modelState, segment.key) : null;
        return resolved ? (
          <CitationChip
            key={index}
            companySlug={companySlug}
            label={resolved.label}
            tab={resolved.tab}
            unit={resolved.unit}
            value={resolved.value}
          />
        ) : (
          <UnresolvedCitation key={index} citationKey={segment.key} />
        );
      })}
    </p>
  );
}
