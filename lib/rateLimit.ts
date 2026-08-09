import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-IP abuse/cost guardrail for the two unauthenticated routes
 * (Architecture §9 — "since V1 has no auth, both `/api/analyst/chat` and
 * `/api/search` are rate-limited per IP via `@upstash/ratelimit`"). A
 * deliberately separate concern from `lib/data/cache.ts` (the Search-tier
 * company-data cache) — different store, different purpose, not merged
 * into it.
 *
 * Fails OPEN when Upstash isn't configured at all (`getSearchRateLimiter`/
 * `getAnalystRateLimiter` return `null`) — the expected, supported state in
 * local dev and in the test suite, so a missing guardrail never takes the
 * product itself down. A *partial* configuration (only one of the two env
 * vars set) is almost certainly a mistake, not an intentionally-disabled
 * guardrail, so it's surfaced loudly by throwing rather than silently
 * treated the same as "not configured" — callers (the route handlers) log
 * and fail open rather than let a misconfigured guardrail break the actual
 * product feature.
 */

export type RateLimitOutcome = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/** The minimal shape routes depend on — real `Ratelimit` instances satisfy it structurally; tests inject a fake without touching Redis or env vars. */
export type RateLimiter = {
  limit(identifier: string): Promise<RateLimitOutcome>;
};

function readUpstashCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url && !token) return null;
  if (!url || !token) {
    throw new Error(
      "Rate limiting is partially configured — both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together."
    );
  }
  return { url, token };
}

let sharedRedis: Redis | undefined;

function buildLimiter(tokens: number, window: Duration, prefix: string): RateLimiter | null {
  const credentials = readUpstashCredentials();
  if (!credentials) return null;
  if (!sharedRedis) {
    sharedRedis = new Redis({ url: credentials.url, token: credentials.token });
  }
  return new Ratelimit({
    redis: sharedRedis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: false,
    prefix,
  });
}

let searchLimiter: RateLimiter | null | undefined;

/** Search-tier limiter: generous — a search is a read-only SEC lookup with no external per-request cost beyond our own compute. */
export function getSearchRateLimiter(): RateLimiter | null {
  if (searchLimiter === undefined) {
    searchLimiter = buildLimiter(20, "60 s", "ratelimit:search");
  }
  return searchLimiter;
}

let analystLimiter: RateLimiter | null | undefined;

/** AI Analyst limiter: deliberately stricter than search — every request that clears it can trigger a real, paid LLM completion. */
export function getAnalystRateLimiter(): RateLimiter | null {
  if (analystLimiter === undefined) {
    analystLimiter = buildLimiter(5, "60 s", "ratelimit:analyst");
  }
  return analystLimiter;
}

/**
 * Best-effort per-client identifier for IP-based limiting. Reads the
 * standard proxy headers (what Vercel and most reverse proxies set); falls
 * back to a single shared bucket rather than throwing when neither is
 * present (e.g. some local/test requests) — an imperfect but honest
 * degradation, not a crash.
 */
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  if (first) return first;

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

/** Seconds until the caller may retry — for the `Retry-After` header on a 429. */
export function retryAfterSeconds(outcome: RateLimitOutcome): number {
  return Math.max(1, Math.ceil((outcome.reset - Date.now()) / 1000));
}

/**
 * The one call site route handlers use: resolves the limiter, checks the
 * requester's identifier against it, and fails open (returns `null`, never
 * throws) on any problem — not configured, partially configured, or a
 * transient Upstash error — so the guardrail can never take the underlying
 * feature down. Route handlers only need to branch on `outcome.success`
 * when `outcome` isn't `null`.
 */
export async function checkRateLimit(
  request: Request,
  getLimiter: () => RateLimiter | null
): Promise<RateLimitOutcome | null> {
  let limiter: RateLimiter | null;
  try {
    limiter = getLimiter();
  } catch (error) {
    console.error("[rateLimit] misconfigured — failing open:", error instanceof Error ? error.message : error);
    return null;
  }
  if (!limiter) return null;

  try {
    return await limiter.limit(getClientIdentifier(request));
  } catch (error) {
    console.error("[rateLimit] check failed — failing open:", error instanceof Error ? error.message : error);
    return null;
  }
}
