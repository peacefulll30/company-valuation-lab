import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data/searchInfra", () => ({
  getSearchEdgarClient: () => ({ fetchJson: vi.fn() }),
  getSearchCache: () => undefined,
}));

const searchCompanyMock = vi.fn();
vi.mock("@/lib/data/searchCompany", () => ({
  searchCompany: (...args: unknown[]) => searchCompanyMock(...args),
}));

async function postSearch(body: unknown) {
  const { POST } = await import("@/app/api/search/route");
  const request = new Request("http://localhost/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await POST(request);
  return { response, json: await response.json() };
}

describe("POST /api/search", () => {
  it("rejects a missing/blank query with 400 before calling searchCompany", async () => {
    searchCompanyMock.mockClear();
    const { response, json } = await postSearch({ query: "   " });
    expect(response.status).toBe(400);
    expect(json.status).toBe("not-found");
    expect(searchCompanyMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid body shape with 400", async () => {
    searchCompanyMock.mockClear();
    const { response, json } = await postSearch({ notQuery: 123 });
    expect(response.status).toBe(400);
    expect(json.status).toBe("not-found");
  });

  it("on success, returns only ticker + name — never the full CompanyFinancials payload", async () => {
    searchCompanyMock.mockResolvedValueOnce({
      status: "success",
      meta: { ticker: "TEST", name: "Test Corp", tier: "searched" },
      financials: { historicals: [{ secret: "should not leak" }] },
      provenance: [],
    });
    const { response, json } = await postSearch({ query: "test" });
    expect(response.status).toBe(200);
    expect(json).toEqual({ status: "success", ticker: "TEST", name: "Test Corp" });
    expect(JSON.stringify(json)).not.toContain("should not leak");
  });

  it.each(["not-found", "unsupported", "insufficient-data", "network-error"])(
    "passes through a %s result with its reason",
    async (status) => {
      searchCompanyMock.mockResolvedValueOnce({ status, reason: `${status} reason` });
      const { json } = await postSearch({ query: "test" });
      expect(json).toEqual({ status, reason: `${status} reason` });
    }
  );

  it("forwards the trimmed query to searchCompany with tier 'searched'", async () => {
    searchCompanyMock.mockClear();
    searchCompanyMock.mockResolvedValueOnce({ status: "not-found", reason: "x" });
    await postSearch({ query: "  apple inc  " });
    expect(searchCompanyMock).toHaveBeenCalledWith(
      expect.anything(),
      "  apple inc  ",
      expect.objectContaining({ tier: "searched" })
    );
  });
});
