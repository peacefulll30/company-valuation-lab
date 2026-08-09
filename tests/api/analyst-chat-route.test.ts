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

function mockFeaturedRecord() {
  return {
    record: { meta: { ...sampleMeta, tier: "featured" as const }, financials: sampleCompany, provenance: [], generatedAt: "2026-01-01T00:00:00.000Z" },
  };
}

function mockSearchedRecord() {
  return {
    record: { meta: { ...sampleMeta, tier: "searched" as const }, financials: sampleCompany, provenance: [], generatedAt: "2026-01-01T00:00:00.000Z" },
  };
}

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

describe("POST /api/analyst/chat — missing API key", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    streamTextMock.mockClear();
    resolveWorkspaceCompanyMock.mockReset();
  });

  afterEach(() => {
    if (originalKey !== undefined) process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("fails gracefully with a clear, calm message instead of crashing or calling the model", async () => {
    const response = await postChat(validBody);
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(text.toLowerCase()).toContain("anthropic_api_key");
    expect(streamTextMock).not.toHaveBeenCalled();
    // Never even attempts company resolution — fails before any real work.
    expect(resolveWorkspaceCompanyMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/analyst/chat — request validation", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    streamTextMock.mockClear();
    resolveWorkspaceCompanyMock.mockReset();
  });

  it("rejects a body missing companySlug/assumptions with 400 before touching the model", async () => {
    const response = await postChat({ messages: [] });
    expect(response.status).toBe(400);
    expect(streamTextMock).not.toHaveBeenCalled();
    expect(resolveWorkspaceCompanyMock).not.toHaveBeenCalled();
  });

  it("rejects assumptions that violate WACC > terminal growth with 422, not a fabricated stream", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockFeaturedRecord());
    const response = await postChat({
      ...validBody,
      assumptions: { ...sampleAssumptions, wacc: 0.02, terminalGrowth: 0.02 },
    });
    expect(response.status).toBe(422);
    const text = await response.text();
    expect(text.toLowerCase()).toContain("terminal growth");
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  it("rejects an unresolvable company with 422", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce({ error: { status: "not-found", reason: "No match." } });
    const response = await postChat({ ...validBody, companySlug: "not-a-real-company-xyz" });
    expect(response.status).toBe(422);
    expect(streamTextMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/analyst/chat — success path wiring", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    streamTextMock.mockClear();
    resolveWorkspaceCompanyMock.mockReset();
  });

  it("streams a response and calls the model with the grounded system prompt and the single recalculateValuation tool", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockFeaturedRecord());
    const response = await postChat(validBody);
    expect(response.status).toBe(200);
    expect(streamTextMock).toHaveBeenCalledTimes(1);

    const call = streamTextMock.mock.calls[0][0];
    expect(Object.keys(call.tools)).toEqual(["recalculateValuation"]);
    expect(call.system).toContain('"tier":"featured"');
    expect(call.system).toContain("recalculateValuation");
  });

  it("works identically for a Search-tier company — same resolver, same grounding path", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockSearchedRecord());
    const response = await postChat({ ...validBody, companySlug: "tsla" });
    expect(response.status).toBe(200);
    const call = streamTextMock.mock.calls[0][0];
    expect(call.system).toContain('"tier":"searched"');
  });
});
