import { describe, expect, it } from "vitest";
import { buildValuationModelState } from "@/lib/engine";
import { CITATION_DEFINITIONS, resolveCitation, splitCitationTokens } from "@/lib/ai/citations";
import { workspaceSections } from "@/lib/site-config";
import { sampleAssumptions, sampleCompany } from "@/tests/engine/fixtures";

const modelState = buildValuationModelState(sampleCompany, sampleAssumptions);

describe("CITATION_DEFINITIONS", () => {
  it("has no duplicate keys — the model's citation vocabulary must be unambiguous", () => {
    const keys = CITATION_DEFINITIONS.map((def) => def.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("only points at real workspace tabs, so every chip's link resolves", () => {
    const validSlugs = new Set(workspaceSections.map((s) => s.slug));
    for (const def of CITATION_DEFINITIONS) {
      expect(validSlugs.has(def.tab)).toBe(true);
    }
  });
});

describe("resolveCitation", () => {
  it("resolves a known key to the engine's actual computed value — never a re-derivation", () => {
    const resolved = resolveCitation(modelState, "dcf.impliedSharePrice");
    expect(resolved).not.toBeNull();
    expect(resolved?.value).toBe(modelState.dcf.impliedSharePrice);
    expect(resolved?.unit).toBe("currency");
    expect(resolved?.tab).toBe("dcf");
  });

  it("resolves assumption keys directly from the current Assumptions, not a snapshot copy", () => {
    const resolved = resolveCitation(modelState, "assumptions.wacc");
    expect(resolved?.value).toBe(sampleAssumptions.wacc);
  });

  it("returns null for a key the model didn't have permission to cite", () => {
    expect(resolveCitation(modelState, "some.made.up.key")).toBeNull();
  });

  it("returns null when the underlying figure isn't available (e.g. comps not supplied)", () => {
    expect(modelState.comps).toBeNull();
    expect(resolveCitation(modelState, "comps.impliedRangeLow")).toBeNull();
  });
});

describe("splitCitationTokens", () => {
  it("returns a single text segment when there are no citations", () => {
    expect(splitCitationTokens("Revenue grew steadily.")).toEqual([{ type: "text", value: "Revenue grew steadily." }]);
  });

  it("splits text around one citation token", () => {
    const segments = splitCitationTokens("WACC is {{cite:assumptions.wacc}} in the base case.");
    expect(segments).toEqual([
      { type: "text", value: "WACC is " },
      { type: "citation", key: "assumptions.wacc" },
      { type: "text", value: " in the base case." },
    ]);
  });

  it("splits text around multiple citation tokens with no text between them", () => {
    const segments = splitCitationTokens("{{cite:dcf.enterpriseValue}}{{cite:dcf.netDebt}}");
    expect(segments).toEqual([
      { type: "citation", key: "dcf.enterpriseValue" },
      { type: "citation", key: "dcf.netDebt" },
    ]);
  });

  it("never invents or drops characters — segments rejoin to the original text", () => {
    const text = "Bear is {{cite:scenarios.bear.impliedSharePrice}}, Bull is {{cite:scenarios.bull.impliedSharePrice}}.";
    const rejoined = splitCitationTokens(text)
      .map((segment) => (segment.type === "text" ? segment.value : `{{cite:${segment.key}}}`))
      .join("");
    expect(rejoined).toBe(text);
  });
});
