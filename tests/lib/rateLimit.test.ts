import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientIdentifier, retryAfterSeconds, type RateLimitOutcome } from "@/lib/rateLimit";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("getSearchRateLimiter / getAnalystRateLimiter — environment validation", () => {
  it("return null (rate limiting disabled) when neither Upstash env var is set", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.resetModules();

    const { getSearchRateLimiter, getAnalystRateLimiter } = await import("@/lib/rateLimit");
    expect(getSearchRateLimiter()).toBeNull();
    expect(getAnalystRateLimiter()).toBeNull();
  });

  it("throws a clear error when only the URL is set (not the token)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.resetModules();

    const { getSearchRateLimiter } = await import("@/lib/rateLimit");
    expect(() => getSearchRateLimiter()).toThrow(/partially configured/i);
  });

  it("throws a clear error when only the token is set (not the URL)", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    vi.resetModules();

    const { getAnalystRateLimiter } = await import("@/lib/rateLimit");
    expect(() => getAnalystRateLimiter()).toThrow(/partially configured/i);
  });

  it("builds a real limiter with a working limit() method when both env vars are set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    vi.resetModules();

    const { getSearchRateLimiter, getAnalystRateLimiter, getMarketRateLimiter } = await import("@/lib/rateLimit");
    const search = getSearchRateLimiter();
    const analyst = getAnalystRateLimiter();
    const market = getMarketRateLimiter();
    expect(search).not.toBeNull();
    expect(analyst).not.toBeNull();
    expect(market).not.toBeNull();
    expect(typeof search?.limit).toBe("function");
    expect(typeof analyst?.limit).toBe("function");
    expect(typeof market?.limit).toBe("function");
  });
});

describe("checkRateLimit — fails open, never throws into the caller", () => {
  it("returns null when the limiter getter returns null (not configured)", async () => {
    const outcome = await checkRateLimit(new Request("http://localhost/x"), () => null);
    expect(outcome).toBeNull();
  });

  it("returns null when the limiter getter throws (e.g. partial misconfiguration)", async () => {
    const outcome = await checkRateLimit(new Request("http://localhost/x"), () => {
      throw new Error("partially configured");
    });
    expect(outcome).toBeNull();
  });

  it("returns null when limit() itself rejects (e.g. a transient Upstash error)", async () => {
    const outcome = await checkRateLimit(new Request("http://localhost/x"), () => ({
      limit: async () => {
        throw new Error("network error");
      },
    }));
    expect(outcome).toBeNull();
  });

  it("returns the real outcome when the limiter allows the request", async () => {
    const fakeOutcome: RateLimitOutcome = { success: true, limit: 5, remaining: 4, reset: Date.now() + 1000 };
    const outcome = await checkRateLimit(new Request("http://localhost/x"), () => ({
      limit: async () => fakeOutcome,
    }));
    expect(outcome).toEqual(fakeOutcome);
  });

  it("returns the exceeded outcome unchanged when the limiter rejects the request", async () => {
    const fakeOutcome: RateLimitOutcome = { success: false, limit: 5, remaining: 0, reset: Date.now() + 30_000 };
    const outcome = await checkRateLimit(new Request("http://localhost/x"), () => ({
      limit: async () => fakeOutcome,
    }));
    expect(outcome).toEqual(fakeOutcome);
  });

  it("passes the extracted client identifier through to limit()", async () => {
    const limitSpy = vi.fn(async () => ({ success: true, limit: 5, remaining: 4, reset: Date.now() }));
    const request = new Request("http://localhost/x", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } });

    await checkRateLimit(request, () => ({ limit: limitSpy }));

    expect(limitSpy).toHaveBeenCalledWith("203.0.113.7");
  });
});

describe("getClientIdentifier", () => {
  it("uses the first IP in x-forwarded-for", () => {
    const request = new Request("http://localhost/x", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } });
    expect(getClientIdentifier(request)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const request = new Request("http://localhost/x", { headers: { "x-real-ip": "198.51.100.4" } });
    expect(getClientIdentifier(request)).toBe("198.51.100.4");
  });

  it("falls back to a shared bucket, not a throw, when no IP header is present", () => {
    const request = new Request("http://localhost/x");
    expect(getClientIdentifier(request)).toBe("unknown");
  });
});

describe("retryAfterSeconds", () => {
  it("computes seconds remaining until reset, rounded up", () => {
    const outcome: RateLimitOutcome = { success: false, limit: 5, remaining: 0, reset: Date.now() + 2500 };
    expect(retryAfterSeconds(outcome)).toBe(3);
  });

  it("never returns less than 1, even if reset is already in the past", () => {
    const outcome: RateLimitOutcome = { success: false, limit: 5, remaining: 0, reset: Date.now() - 5000 };
    expect(retryAfterSeconds(outcome)).toBe(1);
  });
});
