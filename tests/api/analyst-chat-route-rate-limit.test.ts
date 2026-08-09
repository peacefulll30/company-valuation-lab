import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleAssumptions, sampleCompany } from "@/tests/engine/fixtures";
import { sampleMeta } from "@/tests/lib/ai/fixtures";

const resolveWorkspaceCompanyMock = vi.fn();
vi.mock("@/lib/data/workspaceCompany", () => ({
  resolveWorkspaceCompany: (...args: unknown[]) => resolveWorkspaceCompanyMock(...args),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((modelId: string) => ({ modelId, provider: "fake-anthropic" })),
}));

const streamTextMock = vi.fn<(options: { system: string; tools: Record<string, unknown> }) => { stream: ReadableStream }>(
  () => ({
    stream: new ReadableStream({
      start(controller) {
        controller.close();
      },
    }),
  })
);
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    streamText: (options: { system: string; tools: Record<string, unknown> }) => streamTextMock(options),
  };
});

const checkRateLimitMock = vi.fn();
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getAnalystRateLimiter: vi.fn(),
  retryAfterSeconds: (outcome: { reset: number }) => Math.max(1, Math.ceil((outcome.reset - Date.now()) / 1000)),
}));

async function postChat(body: unknown) {
  const { POST } = await import("@/app/api/analyst/chat/route");
  const request = new Request("http://localhost/api/analyst/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request);
}

const validBody = {
  messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "Explain the DCF." }] }],
  companySlug: "test",
  assumptions: sampleAssumptions,
};

function mockFeaturedRecord() {
  return {
    record: { meta: { ...sampleMeta, tier: "featured" as const }, financials: sampleCompany, provenance: [], generatedAt: "2026-01-01T00:00:00.000Z" },
  };
}

/**
 * A dedicated file (rather than extending `analyst-chat-route.test.ts`) so
 * the original functional-behavior tests stay untouched and continue to
 * rely on the real `lib/rateLimit` module's natural fail-open behavior when
 * Upstash isn't configured (as in this test environment) — here we inject
 * controlled outcomes to exercise the 429 branch deterministically.
 */
describe("POST /api/analyst/chat — rate limiting", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    streamTextMock.mockClear();
    resolveWorkspaceCompanyMock.mockReset();
    checkRateLimitMock.mockReset();
  });

  afterEach(() => {
    if (originalKey !== undefined) process.env.ANTHROPIC_API_KEY = originalKey;
    else delete process.env.ANTHROPIC_API_KEY;
  });

  it("returns a calm 429 before touching the model, and even before the missing-API-key check", async () => {
    delete process.env.ANTHROPIC_API_KEY; // proves rate limiting is checked first, not masked by the key check
    checkRateLimitMock.mockResolvedValueOnce({ success: false, limit: 5, remaining: 0, reset: Date.now() + 45_000 });

    const response = await postChat(validBody);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    const text = await response.text();
    expect(text.toLowerCase()).not.toContain("anthropic_api_key");
    expect(streamTextMock).not.toHaveBeenCalled();
    expect(resolveWorkspaceCompanyMock).not.toHaveBeenCalled();
  });

  it("proceeds normally when the limiter allows the request", async () => {
    checkRateLimitMock.mockResolvedValueOnce({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60_000 });
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockFeaturedRecord());

    const response = await postChat(validBody);

    expect(response.status).toBe(200);
    expect(streamTextMock).toHaveBeenCalledTimes(1);
  });

  it("proceeds normally when rate limiting isn't configured (checkRateLimit fails open with null)", async () => {
    checkRateLimitMock.mockResolvedValueOnce(null);
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockFeaturedRecord());

    const response = await postChat(validBody);

    expect(response.status).toBe(200);
  });
});
