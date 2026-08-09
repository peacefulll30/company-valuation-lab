"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useValuationWorkspace } from "@/lib/featured/ValuationWorkspaceContext";
import { resolveCitation, splitCitationTokens } from "@/lib/ai/citations";
import { formatPercent } from "@/lib/format";
import type { ValuationModelState } from "@/lib/engine/results";
import type { AnalystUIMessage } from "@/lib/ai/chatTypes";
import { AnalystMessageText } from "./message-text";
import { CitationChip } from "./citation-chip";

const SUGGESTED_QUESTIONS = [
  "Why is this sensitive to WACC?",
  "What's driving Bear vs. Base?",
  "Explain this DCF simply.",
  "What's the biggest risk to this valuation?",
];

const OVERRIDE_LABELS: Record<string, string> = {
  revenueGrowth: "revenue growth",
  ebitdaMargin: "EBITDA margin",
  taxRate: "tax rate",
  wacc: "WACC",
  terminalGrowth: "terminal growth",
};

function describeOverrides(input: Partial<Record<string, number>>): string {
  const parts = Object.entries(input)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    .map(([key, value]) => `${OVERRIDE_LABELS[key] ?? key} = ${formatPercent(value)}`);
  return parts.length > 0 ? parts.join(", ") : "the current assumptions";
}

/**
 * The `/analyst` tab (Design spec §6) — annotated margin notes, not a
 * messenger app. The client sends only `companySlug` + its own live
 * `Assumptions` on every turn (Architecture §9); the server independently
 * re-derives the trusted model state and is the only place a number is
 * ever computed. When `recalculateValuation` returns a new set of
 * assumptions, this applies them to the same `ValuationWorkspaceProvider`
 * every other tab reads from — a "what if" answer and a manual slider edit
 * converge on the exact same state.
 */
export function AnalystChat() {
  const { record, assumptions, setAssumptions, modelState, modelError } = useValuationWorkspace();
  const companySlug = record.meta.ticker.toLowerCase();

  // A fresh transport instance every render is intentional, not an oversight:
  // `useChat` keeps its own `latestRef` of `transport` internally and always
  // sends through whichever instance was passed on the most recent render
  // (see `@ai-sdk/react`), so this closure captures the current `assumptions`
  // without needing a ref of our own.
  const transport = new DefaultChatTransport<AnalystUIMessage>({
    api: "/api/analyst/chat",
    body: () => ({ companySlug, assumptions }),
  });

  const { messages, sendMessage, status, error, regenerate } = useChat<AnalystUIMessage>({ transport });
  const [input, setInput] = useState("");

  const appliedToolCallIds = useRef(new Set<string>());
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (part.type !== "tool-recalculateValuation" || part.state !== "output-available") continue;
        if (appliedToolCallIds.current.has(part.toolCallId)) continue;
        appliedToolCallIds.current.add(part.toolCallId);
        if (part.output.ok) setAssumptions(part.output.assumptions);
      }
    }
  }, [messages, setAssumptions]);

  const isBusy = status === "submitted" || status === "streaming";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  function askSuggested(question: string) {
    if (isBusy) return;
    sendMessage({ text: question });
  }

  if (modelError) {
    return (
      <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
        The analyst can&rsquo;t ground itself in the current assumptions — {modelError} Adjust the assumptions on another
        tab to resolve this before continuing here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-96 flex-col gap-4 rounded-md border border-border bg-card p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              Ask about the historicals, the forecast, the DCF, or what&rsquo;s driving the range. Every number in the
              answer traces back to this model.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => askSuggested(question)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground outline-none hover:border-brand-accent hover:text-brand-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div role="log" aria-label="Conversation with the analyst" aria-busy={isBusy} className="flex flex-col gap-6">
            {messages.map((message) => (
              <AnalystMessage key={message.id} message={message} modelState={modelState} companySlug={companySlug} />
            ))}
          </div>
        )}

        {isBusy ? (
          <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Analyst is thinking…
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <span>{error.message || "The analyst couldn't respond."}</span>
            <button
              type="button"
              onClick={() => regenerate()}
              className="rounded-sm font-medium underline decoration-destructive/50 underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the analyst…"
          aria-label="Ask the analyst"
          disabled={isBusy}
        />
        <Button type="submit" disabled={isBusy || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}

function AnalystMessage({
  message,
  modelState,
  companySlug,
}: {
  message: AnalystUIMessage;
  modelState: ValuationModelState | null;
  companySlug: string;
}) {
  const roleLabel = message.role === "user" ? "You" : "Analyst";
  const citedKeys = new Set<string>();

  const parts = message.parts.map((part, index) => {
    if (part.type === "text") {
      for (const segment of splitCitationTokens(part.text)) {
        if (segment.type === "citation") citedKeys.add(segment.key);
      }
      return <AnalystMessageText key={index} text={part.text} modelState={modelState} companySlug={companySlug} />;
    }

    if (part.type === "tool-recalculateValuation") {
      switch (part.state) {
        case "input-streaming":
        case "input-available":
          return (
            <p key={index} className="text-xs text-muted-foreground">
              Recalculating with {describeOverrides(part.input ?? {})}…
            </p>
          );
        case "output-available":
          return part.output.ok ? (
            <p key={index} className="text-xs text-brand-accent">
              Recalculated with {describeOverrides(part.input ?? {})}.
            </p>
          ) : (
            <p
              key={index}
              role="alert"
              className="rounded-sm border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs text-destructive"
            >
              Couldn&rsquo;t recalculate: {part.output.error}
            </p>
          );
        case "output-error":
          return (
            <p
              key={index}
              role="alert"
              className="rounded-sm border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs text-destructive"
            >
              Couldn&rsquo;t recalculate: {part.errorText}
            </p>
          );
        default:
          return null;
      }
    }

    return null;
  });

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{roleLabel}</p>
      <div className="flex flex-col gap-2">{parts}</div>
      {citedKeys.size > 0 && modelState ? (
        <details className="mt-1">
          <summary className="cursor-pointer rounded-sm text-[11px] font-medium tracking-wide text-muted-foreground uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Referenced in this answer ({citedKeys.size})
          </summary>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {Array.from(citedKeys).map((key) => {
              const resolved = resolveCitation(modelState, key);
              if (!resolved) return null;
              return (
                <li key={key}>
                  <CitationChip
                    companySlug={companySlug}
                    label={resolved.label}
                    tab={resolved.tab}
                    unit={resolved.unit}
                    value={resolved.value}
                  />
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
