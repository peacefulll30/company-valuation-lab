import { describe, expect, it, vi } from "vitest";
import { createInMemoryCache, withCache } from "@/lib/data/cache";

describe("createInMemoryCache", () => {
  it("returns null for a missing key", async () => {
    const cache = createInMemoryCache();
    expect(await cache.get("missing")).toBeNull();
  });

  it("returns a stored value before it expires", async () => {
    const cache = createInMemoryCache();
    await cache.set("k", { a: 1 }, 60);
    expect(await cache.get("k")).toEqual({ a: 1 });
  });

  it("expires a value after its TTL", async () => {
    vi.useFakeTimers();
    try {
      const cache = createInMemoryCache();
      await cache.set("k", "value", 10);
      vi.advanceTimersByTime(10_001);
      expect(await cache.get("k")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("withCache", () => {
  it("computes once and serves subsequent calls from cache", async () => {
    const cache = createInMemoryCache();
    const compute = vi.fn().mockResolvedValue("computed");

    const first = await withCache(cache, "key", 60, compute);
    const second = await withCache(cache, "key", 60, compute);

    expect(first).toBe("computed");
    expect(second).toBe("computed");
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it("computes fresh every time when no cache is provided", async () => {
    const compute = vi.fn().mockResolvedValue("computed");
    await withCache(undefined, "key", 60, compute);
    await withCache(undefined, "key", 60, compute);
    expect(compute).toHaveBeenCalledTimes(2);
  });
});
