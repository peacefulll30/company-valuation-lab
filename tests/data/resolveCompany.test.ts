import { describe, expect, it } from "vitest";
import { resolveCompany } from "@/lib/data/resolveCompany";
import type { EdgarClient } from "@/lib/data/edgar";
import { buildCompanyFacts } from "./fixtures";

const CIK = "0001234567";

function fakeClient(overrides: {
  tickerIndex?: Record<string, { cik_str: number; ticker: string; title: string }>;
  sic?: string;
  companyFacts?: ReturnType<typeof buildCompanyFacts>;
}): EdgarClient {
  const tickerIndex = overrides.tickerIndex ?? {
    "0": { cik_str: 1234567, ticker: "TEST", title: "Test Corp" },
  };

  return {
    async fetchJson<T>(url: string): Promise<T> {
      if (url.includes("company_tickers.json")) return tickerIndex as T;
      if (url.includes("/submissions/")) {
        return {
          cik: CIK,
          name: "Test Corp",
          sic: overrides.sic ?? "3571",
          sicDescription: "Electronic Computers",
          tickers: ["TEST"],
        } as T;
      }
      if (url.includes("/companyfacts/")) {
        return (overrides.companyFacts ?? buildCompanyFacts()) as T;
      }
      throw new Error(`Unexpected URL in fake client: ${url}`);
    },
  };
}

describe("resolveCompany", () => {
  it("returns not-found when the ticker isn't in the SEC index", async () => {
    const client = fakeClient({ tickerIndex: {} });
    const result = await resolveCompany(client, "NOPE");
    expect(result.status).toBe("not-found");
  });

  it("returns unsupported for a blocked SIC code (bank/insurer)", async () => {
    const client = fakeClient({ sic: "6021" }); // national commercial bank
    const result = await resolveCompany(client, "TEST");
    expect(result.status).toBe("unsupported");
    if (result.status === "unsupported") {
      expect(result.sicCode).toBe("6021");
      expect(result.reason).toContain("financial institution");
    }
  });

  it("returns insufficient-data when the normalizer can't resolve a required field", async () => {
    const brokenFacts = buildCompanyFacts({ OperatingIncomeLoss: undefined as never });
    const client = fakeClient({ companyFacts: brokenFacts });
    const result = await resolveCompany(client, "TEST");
    expect(result.status).toBe("insufficient-data");
  });

  it("returns success with a schema-validated CompanyFinancials for a clean company", async () => {
    const client = fakeClient({});
    const result = await resolveCompany(client, "TEST", { tier: "featured" });
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.meta.ticker).toBe("TEST");
      expect(result.meta.tier).toBe("featured");
      expect(result.financials.historicals).toHaveLength(5);
      expect(result.financials.currentPrice).toBeNull();
      expect(result.provenance.length).toBeGreaterThan(0);
    }
  });

  it("never fabricates a current price — always null when none was supplied", async () => {
    const client = fakeClient({});
    const result = await resolveCompany(client, "TEST");
    if (result.status === "success") {
      expect(result.financials.currentPrice).toBeNull();
    } else {
      throw new Error("expected success");
    }
  });

  it("returns network-error (not a thrown exception) when SEC EDGAR is unreachable", async () => {
    const client: EdgarClient = {
      async fetchJson<T>(url: string): Promise<T> {
        if (url.includes("company_tickers.json")) {
          return { "0": { cik_str: 1234567, ticker: "TEST", title: "Test Corp" } } as T;
        }
        throw new Error("fetch failed: ECONNRESET");
      },
    };
    const result = await resolveCompany(client, "TEST");
    expect(result.status).toBe("network-error");
    if (result.status === "network-error") {
      expect(result.reason).toContain("ECONNRESET");
    }
  });
});
