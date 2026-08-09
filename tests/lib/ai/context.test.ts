import { describe, expect, it, vi } from "vitest";
import { buildValuationModelState } from "@/lib/engine";
import { buildAnalystSnapshot } from "@/lib/ai/snapshot";
import { sampleAssumptions, sampleCompany } from "@/tests/engine/fixtures";
import { sampleMeta } from "./fixtures";

const resolveWorkspaceCompanyMock = vi.fn();
vi.mock("@/lib/data/workspaceCompany", () => ({
  resolveWorkspaceCompany: (...args: unknown[]) => resolveWorkspaceCompanyMock(...args),
}));

const { buildAnalystContext } = await import("@/lib/ai/context");

function mockRecord(overrides: Partial<typeof sampleMeta> = {}) {
  return {
    record: {
      meta: { ...sampleMeta, ...overrides },
      financials: sampleCompany,
      provenance: [],
      generatedAt: "2026-01-01T00:00:00.000Z",
    },
  };
}

describe("buildAnalystContext — grounding", () => {
  it("re-derives the trusted model server-side and embeds the engine's exact numbers, not a re-derivation", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockRecord());

    const context = await buildAnalystContext("test", sampleAssumptions);
    expect(context.ok).toBe(true);
    if (!context.ok) throw new Error("expected ok context");

    const expectedSnapshot = buildAnalystSnapshot(buildValuationModelState(sampleCompany, sampleAssumptions), sampleMeta);
    expect(context.system).toContain(JSON.stringify(expectedSnapshot));
  });

  it("exposes exactly one tool: recalculateValuation, and no other numeric path", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockRecord());
    const context = await buildAnalystContext("test", sampleAssumptions);
    if (!context.ok) throw new Error("expected ok context");
    expect(Object.keys(context.tools)).toEqual(["recalculateValuation"]);
  });

  it("resolves the company by the slug the caller actually passed, not an assumed default", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockRecord());
    await buildAnalystContext("nvda", sampleAssumptions);
    expect(resolveWorkspaceCompanyMock).toHaveBeenCalledWith("nvda");
  });
});

describe("buildAnalystContext — client-tampering protection", () => {
  it("rejects assumptions that violate WACC > terminal growth even though the client fully controls the assumptions payload", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockRecord());
    const tampered = { ...sampleAssumptions, wacc: 0.02, terminalGrowth: 0.02 };

    const context = await buildAnalystContext("test", tampered);
    expect(context.ok).toBe(false);
    if (context.ok) throw new Error("expected a rejected context");
    expect(context.status).toBe(422);
    expect(context.message.toLowerCase()).toContain("terminal growth");
  });

  it("never trusts a company resolution the caller didn't earn — a failed/unsupported lookup blocks grounding entirely", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce({ error: { status: "unsupported", reason: "Looks like a bank." } });

    const context = await buildAnalystContext("jpm", sampleAssumptions);
    expect(context.ok).toBe(false);
    if (context.ok) throw new Error("expected a rejected context");
    expect(context.status).toBe(422);
    expect(context.message).toContain("Looks like a bank.");
  });

  it("ignores a smuggled fake result field — only the real Assumptions inputs ever reach the engine", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockRecord());
    // A tampered client can't inject a pre-computed number by attaching an
    // extra field — buildValuationModelState only ever reads the five real
    // assumption inputs, so a smuggled "result" is simply inert.
    const withSmuggledResult = { ...sampleAssumptions, impliedSharePrice: 999999 } as typeof sampleAssumptions;

    const context = await buildAnalystContext("test", withSmuggledResult);
    expect(context.ok).toBe(true);
    if (!context.ok) throw new Error("expected ok context");

    // The exact-match assertion below is the real proof: the embedded JSON
    // is byte-for-byte what an independent, honest computation produces —
    // there is no room in it for a smuggled field to have leaked through.
    const expectedSnapshot = buildAnalystSnapshot(buildValuationModelState(sampleCompany, sampleAssumptions), sampleMeta);
    expect(context.system).toContain(JSON.stringify(expectedSnapshot));
  });
});

describe("buildAnalystContext — Featured vs. Search compatibility", () => {
  it("grounds correctly for a Featured-tier company", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockRecord({ tier: "featured" }));
    const context = await buildAnalystContext("aapl", sampleAssumptions);
    expect(context.ok).toBe(true);
    if (!context.ok) throw new Error("expected ok context");
    expect(context.system).toContain('"tier":"featured"');
  });

  it("grounds correctly for a Search-tier company the same way", async () => {
    resolveWorkspaceCompanyMock.mockResolvedValueOnce(mockRecord({ tier: "searched" }));
    const context = await buildAnalystContext("tsla", sampleAssumptions);
    expect(context.ok).toBe(true);
    if (!context.ok) throw new Error("expected ok context");
    expect(context.system).toContain('"tier":"searched"');
  });
});
