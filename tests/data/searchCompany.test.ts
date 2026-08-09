import { describe, expect, it, vi } from "vitest";
import { searchCompany } from "@/lib/data/searchCompany";
import { createInMemoryCache } from "@/lib/data/cache";
import type { EdgarClient } from "@/lib/data/edgar";
import { buildCompanyFacts } from "./fixtures";

const TICKER_INDEX = {
  "0": { cik_str: 1234567, ticker: "TEST", title: "Test Corp" },
  "1": { cik_str: 7654321, ticker: "BANK", title: "First National Bank Holdings" },
};

function fakeClient(overrides: {
  sic?: string;
  companyFacts?: ReturnType<typeof buildCompanyFacts>;
  fetchJsonSpy?: (url: string) => void;
}): EdgarClient {
  const fetchJson = async <T>(url: string): Promise<T> => {
    overrides.fetchJsonSpy?.(url);
    if (url.includes("company_tickers.json")) return TICKER_INDEX as T;
    if (url.includes("/submissions/")) {
      const isBank = url.includes("0007654321");
      return {
        cik: isBank ? "0007654321" : "0001234567",
        name: isBank ? "First National Bank Holdings" : "Test Corp",
        sic: overrides.sic ?? (isBank ? "6021" : "3571"),
        sicDescription: isBank ? "National Commercial Banks" : "Electronic Computers",
        tickers: [isBank ? "BANK" : "TEST"],
      } as T;
    }
    if (url.includes("/companyfacts/")) return (overrides.companyFacts ?? buildCompanyFacts()) as T;
    throw new Error(`Unexpected URL in fake client: ${url}`);
  };
  return { fetchJson };
}

describe("searchCompany — resolution by ticker and by name", () => {
  it("resolves an exact ticker match directly", async () => {
    const client = fakeClient({});
    const result = await searchCompany(client, "TEST");
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.meta.ticker).toBe("TEST");
  });

  it("falls back to a company-name search when the query isn't a known ticker", async () => {
    const client = fakeClient({});
    const result = await searchCompany(client, "Test Corp");
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.meta.ticker).toBe("TEST");
  });

  it("resolves a partial/lowercase company name via substring match", async () => {
    const client = fakeClient({});
    const result = await searchCompany(client, "test");
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.meta.ticker).toBe("TEST");
  });
});

describe("searchCompany — failure states", () => {
  it("not-found: empty query", async () => {
    const client = fakeClient({});
    const result = await searchCompany(client, "   ");
    expect(result.status).toBe("not-found");
  });

  it("not-found: no ticker or name match", async () => {
    const client = fakeClient({});
    const result = await searchCompany(client, "totally unknown company xyz");
    expect(result.status).toBe("not-found");
  });

  it("unsupported: bank/insurer via name search", async () => {
    const client = fakeClient({});
    const result = await searchCompany(client, "First National Bank Holdings");
    expect(result.status).toBe("unsupported");
    if (result.status === "unsupported") expect(result.sicCode).toBe("6021");
  });

  it("insufficient-data: normalization can't resolve a required field", async () => {
    const brokenFacts = buildCompanyFacts({ OperatingIncomeLoss: undefined as never });
    const client = fakeClient({ companyFacts: brokenFacts });
    const result = await searchCompany(client, "TEST");
    expect(result.status).toBe("insufficient-data");
  });

  it("network-error: SEC EDGAR unreachable during identifier resolution", async () => {
    const client: EdgarClient = {
      async fetchJson<T>(): Promise<T> {
        throw new Error("fetch failed: getaddrinfo ENOTFOUND");
      },
    };
    const result = await searchCompany(client, "anything");
    expect(result.status).toBe("network-error");
  });

  it("network-error: SEC EDGAR unreachable during retrieval (after identifier resolves)", async () => {
    const client: EdgarClient = {
      async fetchJson<T>(url: string): Promise<T> {
        if (url.includes("company_tickers.json")) return TICKER_INDEX as T;
        throw new Error("fetch failed: 503");
      },
    };
    const result = await searchCompany(client, "TEST");
    expect(result.status).toBe("network-error");
  });
});

describe("searchCompany — caching", () => {
  it("serves a repeat lookup from cache without a second SEC retrieval", async () => {
    const fetchJsonSpy = vi.fn();
    const client = fakeClient({ fetchJsonSpy });
    const cache = createInMemoryCache();

    const first = await searchCompany(client, "TEST", { cache });
    const callsAfterFirst = fetchJsonSpy.mock.calls.length;
    expect(first.status).toBe("success");
    expect(callsAfterFirst).toBeGreaterThan(0);

    const second = await searchCompany(client, "TEST", { cache });
    expect(second).toEqual(first);
    // No new SEC calls for the second, cached lookup.
    expect(fetchJsonSpy.mock.calls.length).toBe(callsAfterFirst);
  });

  it("does not cache across different tickers", async () => {
    const fetchJsonSpy = vi.fn();
    const client = fakeClient({ fetchJsonSpy });
    const cache = createInMemoryCache();

    await searchCompany(client, "TEST", { cache });
    const callsAfterFirst = fetchJsonSpy.mock.calls.length;

    const bankResult = await searchCompany(client, "BANK", { cache });
    expect(bankResult.status).toBe("unsupported");
    expect(fetchJsonSpy.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });
});
