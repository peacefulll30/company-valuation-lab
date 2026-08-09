import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, createUIMessageStreamResponse, stepCountIs, streamText, toUIMessageStream, type UIMessage } from "ai";
import { assumptionsSchema } from "@/lib/schemas";
import { buildAnalystContext } from "@/lib/ai/context";
import { checkRateLimit, getAnalystRateLimiter, retryAfterSeconds } from "@/lib/rateLimit";

const ANALYST_MODEL_ID = process.env.ANTHROPIC_ANALYST_MODEL ?? "claude-sonnet-5";

const requestSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())).max(200),
  companySlug: z.string().min(1).max(64),
  assumptions: assumptionsSchema,
});

/**
 * AI Analyst chat (Architecture §9). The client sends only `companySlug` +
 * its current `Assumptions` on every turn — never a model-state blob — and
 * `buildAnalystContext` independently re-derives the trusted
 * `ValuationModelState` from those inputs via the same resolver and the
 * same pure engine the rest of the app uses, before the model ever sees a
 * number. A tampered or stale client payload can at worst request a
 * recompute with different (still validated) assumption inputs; it can
 * never inject a fabricated result directly into the grounding context.
 *
 * Rate-limited per IP, deliberately stricter than `/api/search` — every
 * request that clears it can trigger a real, paid LLM completion
 * (Architecture §9).
 */
export async function POST(request: Request) {
  const rateLimitOutcome = await checkRateLimit(request, getAnalystRateLimiter);
  if (rateLimitOutcome && !rateLimitOutcome.success) {
    return new Response("The analyst is getting a lot of questions right now. Wait a moment and try again.", {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds(rateLimitOutcome)) },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "The AI Analyst isn't configured yet — the server is missing an ANTHROPIC_API_KEY environment variable. Set it and restart the app to enable this tab.",
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid chat request — missing company or assumptions context.", { status: 400 });
  }
  const { messages, companySlug, assumptions } = parsed.data;

  const context = await buildAnalystContext(companySlug, assumptions);
  if (!context.ok) {
    return new Response(context.message, { status: context.status });
  }

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages as unknown as UIMessage[], { tools: context.tools });
  } catch {
    return new Response("Couldn't read the conversation history.", { status: 400 });
  }

  const result = streamText({
    model: anthropic(ANALYST_MODEL_ID),
    system: context.system,
    messages: modelMessages,
    tools: context.tools,
    stopWhen: stepCountIs(4),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) => {
        if (error instanceof Error) return error.message;
        return "The analyst hit an unexpected error while responding.";
      },
    }),
  });
}
