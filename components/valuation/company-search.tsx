"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; status: string; reason: string; query: string };

const ERROR_COPY: Record<string, string> = {
  "not-found": "No SEC-registered company found for",
  unsupported: "isn't supported — it's a bank, insurer, or other financial institution, which this model excludes by design for",
  "insufficient-data": "is supported, but there isn't enough complete, reliable financial data to build a model yet for",
  "network-error": "Couldn't reach SEC EDGAR right now while searching for",
  "rate-limited": "Too many searches in a short time — wait a moment before searching again for",
};

/**
 * Wired to `POST /api/search` (Phase 5) — resolve → SEC retrieval →
 * normalize → validate happens entirely server-side. On success, navigates
 * to that company's workspace; on any failure, the error renders inline
 * here and the app never navigates (CLAUDE.md — "the Company Selection
 * page is the only place eligibility failures surface").
 */
export function CompanySearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ phase: "idle" });

  async function runSearch(searchQuery: string) {
    setState({ phase: "loading" });
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();

      if (data.status === "success") {
        router.push(`/valuation/${data.ticker.toLowerCase()}/overview`);
        return;
      }

      setState({ phase: "error", status: data.status, reason: data.reason, query: searchQuery });
    } catch {
      setState({
        phase: "error",
        status: "network-error",
        reason: "Couldn't reach the search service — check your connection and try again.",
        query: searchQuery,
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    void runSearch(trimmed);
  }

  const isLoading = state.phase === "loading";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            name="company-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (state.phase === "error") setState({ phase: "idle" });
            }}
            placeholder="Search by company name or ticker"
            aria-label="Search by company name or ticker"
            className="h-12 rounded-lg border-white/10 bg-card pl-11 text-base shadow-none transition-shadow duration-300 focus-visible:border-brand-accent/60 focus-visible:ring-brand-accent/20 focus-visible:shadow-[0_0_24px_-8px_var(--brand-glow)]"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 rounded-lg px-6"
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isLoading ? "Searching…" : "Search"}
        </Button>
      </div>

      <div role="status" aria-live="polite" className="mt-2 min-h-5 text-sm">
        {state.phase === "error" ? (
          <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span>
              {ERROR_COPY[state.status] ?? "Something went wrong searching for"} &ldquo;{state.query}&rdquo;.
            </span>
            <button
              type="button"
              onClick={() => void runSearch(state.query)}
              className="rounded-sm font-medium text-foreground underline decoration-muted-foreground/50 underline-offset-2 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try again
            </button>
          </p>
        ) : null}
      </div>
    </form>
  );
}
