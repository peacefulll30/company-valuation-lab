/**
 * Shared SEC EDGAR fetch layer — used by both the offline Featured-company
 * pipeline and (later) Search-tier retrieval, so there is exactly one place
 * that knows how to talk to SEC EDGAR (CLAUDE.md — "one implementation of
 * every invariant/pipeline, not two").
 *
 * SEC EDGAR requires a descriptive `User-Agent` identifying the requester
 * (https://www.sec.gov/os/webmaster-faq#developers) and asks for a
 * conservative request rate. This client enforces a minimum interval
 * between requests sequentially — adequate for a single-process offline
 * script; a distributed-safe rate limiter (Upstash) is explicitly deferred
 * (Phase 3 instructions — "do not overbuild Redis/runtime search yet").
 */

export type FetchImpl = typeof fetch;

const DEFAULT_MIN_INTERVAL_MS = 350;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;

export const DEFAULT_USER_AGENT =
  process.env.SEC_EDGAR_USER_AGENT ?? "Company Valuation Lab research@company-valuation-lab.dev";

export class EdgarFetchError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "EdgarFetchError";
  }
}

export type EdgarClientOptions = {
  fetchImpl?: FetchImpl;
  userAgent?: string;
  minIntervalMs?: number;
  timeoutMs?: number;
  maxRetries?: number;
};

export type EdgarClient = {
  fetchJson<T>(url: string): Promise<T>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a rate-limited, retrying JSON client. A factory (rather than a
 * bare module-level function) so tests can inject a fake `fetchImpl` and a
 * zero interval without touching the network or slowing the suite down,
 * while the real pipeline gets the conservative defaults.
 */
export function createEdgarClient(options: EdgarClientOptions = {}): EdgarClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  let lastRequestAt = 0;

  async function throttle(): Promise<void> {
    if (minIntervalMs <= 0) return;
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < minIntervalMs) {
      await sleep(minIntervalMs - elapsed);
    }
    lastRequestAt = Date.now();
  }

  async function fetchJson<T>(url: string): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      await throttle();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImpl(url, {
          headers: {
            "User-Agent": userAgent,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          if (retryable && attempt < maxRetries) {
            lastError = new EdgarFetchError(
              `EDGAR request failed with ${response.status}`,
              url,
              response.status
            );
            continue;
          }
          throw new EdgarFetchError(`EDGAR request failed with ${response.status}`, url, response.status);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
        if (attempt >= maxRetries) break;
      } finally {
        clearTimeout(timeout);
      }
    }

    if (lastError instanceof EdgarFetchError) throw lastError;
    throw new EdgarFetchError(`EDGAR request failed: ${String(lastError)}`, url);
  }

  return { fetchJson };
}
