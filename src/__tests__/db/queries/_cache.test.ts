// @vitest-environment node
//
// The read-through cache behind getSiteSettings and the tag aggregates. Tested
// directly on the helper (not through a query) so the loader can be counted:
// through a query, "cached" and "the DB happened to return the same rows" are
// indistinguishable, and every assertion below would pass against no cache
// at all.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { cached, clearQueryCache, invalidate, invalidateContentCaches } from "@/db/queries/_cache";

beforeEach(() => {
  clearQueryCache();
  vi.useRealTimers();
});

describe("cached", () => {
  it("should run the loader once when the same key is read twice", async () => {
    const load = vi.fn(async () => "value");

    expect(await cached("k", load)).toBe("value");
    expect(await cached("k", load)).toBe("value");

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("should keep entries separate per key", async () => {
    const load = vi.fn(async (n: number) => n);

    expect(await cached("a", () => load(1))).toBe(1);
    expect(await cached("b", () => load(2))).toBe(2);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("should share one loader run between callers that overlap", async () => {
    // Two reads inside one request — the layout shell and pageChrome both ask
    // for the settings map before either resolves. Storing the promise rather
    // than the value is what collapses them into a single query.
    let resolve: (v: string) => void = () => {};
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)));

    const first = cached("k", load);
    const second = cached("k", load);
    resolve("value");

    expect(await first).toBe("value");
    expect(await second).toBe("value");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("should reload after the ttl lapses", async () => {
    vi.useFakeTimers();
    const load = vi.fn(async () => "value");

    await cached("k", load, 1_000);
    vi.advanceTimersByTime(1_001);
    await cached("k", load, 1_000);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("should not cache a rejected load", async () => {
    // A transient D1 error must not be served for a full TTL.
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("D1_ERROR"))
      .mockResolvedValueOnce("value");

    await expect(cached("k", load)).rejects.toThrow("D1_ERROR");
    expect(await cached("k", load)).toBe("value");
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("invalidate", () => {
  it("should drop only the named key", async () => {
    const load = vi.fn(async () => "value");
    await cached("keep", load);
    await cached("drop", load);

    invalidate("drop");
    await cached("keep", load);
    await cached("drop", load);

    expect(load).toHaveBeenCalledTimes(3);
  });
});

describe("invalidateContentCaches", () => {
  it("should drop tag aggregates and leave site settings alone", async () => {
    // A post edit changes tag counts but not the settings map; dropping both
    // would make every save pay for a settings reload it does not need.
    const load = vi.fn(async () => "value");
    await cached("tags:counts", load);
    await cached("site:settings", load);

    invalidateContentCaches();
    await cached("tags:counts", load);
    await cached("site:settings", load);

    expect(load).toHaveBeenCalledTimes(3);
  });
});
