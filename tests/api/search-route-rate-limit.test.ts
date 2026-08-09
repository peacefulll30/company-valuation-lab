import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data/searchInfra", () => ({
  getSearchEdgarClient: () => ({ fetchJson: vi.fn() }),
  getSearchCache: () => undefined,
}));

const searchCompanyMock = vi.fn();
vi.mock("@/lib/data/searchCompany", () => ({
  searchCompany: (...args: unknown[]) => searchCompanyMock(...args),
}));

const checkRateLimitMock = vi.fn();
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getSearchRateLimiter: vi.fn(),
  retryAfterSeconds: (outcome: { reset: number }) => Math.max(1, Math.ceil((outcome.reset - Date.now()) / 1000)),
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

/**
 * A dedicated file (rather than extending `search-route.test.ts`) so the
 * original functional-behavior tests stay untouched and continue to rely
 * on the real `lib/rateLimit` module's natural fail-open behavior when
 * Upstash isn't configured (as in this test environment) — here we inject
 * controlled outcomes to exercise the 429 branch deterministically.
 */
describe("POST /api/search — rate limiting", () => {
  it("returns a calm, typed 429 and never calls searchCompany when the limiter rejects the request", async () => {
    checkRateLimitMock.mockResolvedValueOnce({ success: false, limit: 20, remaining: 0, reset: Date.now() + 30_000 });
    searchCompanyMock.mockClear();

    const { response, json } = await postSearch({ query: "apple" });

    expect(response.status).toBe(429);
    expect(json.status).toBe("rate-limited");
    expect(typeof json.reason).toBe("string");
    expect(json.reason.length).toBeGreaterThan(0);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(searchCompanyMock).not.toHaveBeenCalled();
  });

  it("proceeds normally when the limiter allows the request", async () => {
    checkRateLimitMock.mockResolvedValueOnce({ success: true, limit: 20, remaining: 19, reset: Date.now() + 60_000 });
    searchCompanyMock.mockResolvedValueOnce({ status: "not-found", reason: "No match." });

    const { response, json } = await postSearch({ query: "apple" });

    expect(response.status).toBe(200);
    expect(json.status).toBe("not-found");
    expect(searchCompanyMock).toHaveBeenCalled();
  });

  it("proceeds normally when rate limiting isn't configured (checkRateLimit fails open with null)", async () => {
    checkRateLimitMock.mockResolvedValueOnce(null);
    searchCompanyMock.mockResolvedValueOnce({ status: "not-found", reason: "No match." });

    const { response } = await postSearch({ query: "apple" });

    expect(response.status).toBe(200);
    expect(searchCompanyMock).toHaveBeenCalled();
  });
});
