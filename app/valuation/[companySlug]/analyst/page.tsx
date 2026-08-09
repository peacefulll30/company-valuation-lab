import type { Metadata } from "next";
import { AnalystChat } from "@/components/valuation/analyst/analyst-chat";
import { ConceptInfo } from "@/components/valuation/concept-info";

export const metadata: Metadata = { title: "AI Analyst — Company Valuation Lab" };

export default function AnalystPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs text-muted-foreground">09 — AI Analyst</p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="font-display text-2xl font-medium sm:text-3xl">Ask the analyst</h1>
          <ConceptInfo concept="analyst" />
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The analyst explains and interprets this model — it never computes a figure on its own. Every cited number
          is pulled live from the deterministic engine, and any &ldquo;what if&rdquo; question runs through the same
          recalculation the rest of this workspace uses.
        </p>
      </div>
      <AnalystChat />
    </div>
  );
}
