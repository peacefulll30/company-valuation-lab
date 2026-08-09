/**
 * A caching *boundary* for the Search tier (Phase 3 brief — "add
 * caching-ready boundaries for Search, but do not overbuild Redis/runtime
 * search yet"). This is the seam a future route handler wires an Upstash
 * Redis-backed implementation into (Architecture §10); today it ships an
 * in-memory implementation only, and nothing in this phase depends on
 * caching to function correctly — `resolveCompany` works with or without
 * one.
 */
export type DataCache = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
};

type CacheEntry = { value: unknown; expiresAt: number };

/** A process-local cache for local dev/tests. Not shared across serverless invocations — swap for Redis before Search ships. */
export function createInMemoryCache(): DataCache {
  const store = new Map<string, CacheEntry>();

  return {
    async get<T>(key: string): Promise<T | null> {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value as T;
    },
    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
  };
}

/** Wraps a computation with a cache read-through/write-through — the shape a Search route handler will call. */
export async function withCache<T>(
  cache: DataCache | undefined,
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  if (!cache) return compute();

  const cached = await cache.get<T>(key);
  if (cached !== null) return cached;

  const value = await compute();
  await cache.set(key, value, ttlSeconds);
  return value;
}
