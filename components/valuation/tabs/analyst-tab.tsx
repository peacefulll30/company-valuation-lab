import { AnalystChat } from "@/components/valuation/analyst/analyst-chat";
import { ConceptInfo } from "@/components/valuation/concept-info";
import { Reveal } from "@/components/valuation/reveal";

/**
 * The AI Analyst section (extracted from the old dedicated `/analyst`
 * route's page body so it can be composited into the single continuous
 * workspace journey like the other 8 sections — same header pattern,
 * same `ConceptInfo`, same `<AnalystChat>` underneath).
 */
export function AnalystTab() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">09 — AI Analyst</p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ask the analyst</h1>
          <ConceptInfo concept="analyst" />
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The analyst explains and interprets this model — it never computes a figure on its own. Every cited number
          is pulled live from the deterministic engine, and any &ldquo;what if&rdquo; question runs through the same
          recalculation the rest of this workspace uses.
        </p>
      </div>
      <Reveal delay={0.1}>
        <AnalystChat />
      </Reveal>
    </div>
  );
}
