// Isolate-local read-through cache for the read-mostly queries that every
// request re-runs.
//
// Three queries dominated D1's rows-read bill (~60% of it) despite the site
// having one author and near-zero write traffic:
//
//   - `getSiteSettings` — 18 rows, but ~4.4k calls/day. Every page reads it
//     twice (the layout shell, then `pageChrome` for the tab title), so the
//     count scales with navigations, not with content.
//   - `getTagsWithCounts` / `getTagsInSection` — aggregates SQLite answers by
//     scanning `interview_notes` and walking the junction table (~2–3k rows
//     read per call). No index fixes that: the WHERE matches every row, so the
//     work is inherent to recomputing the aggregate. The only fix is to stop
//     recomputing it per request.
//
// All three change only when the author writes, which is why an in-memory
// cache is the right shape here rather than a schema or index change.
//
// Scope and staleness. The store lives in the Worker isolate, so it is not
// shared across isolates or across a deploy — a cold isolate simply misses and
// reloads. Writers call `invalidateContentCaches()` (the mutation that ran in
// THIS isolate sees its own write immediately), and `CACHE_TTL_MS` bounds how
// long any other isolate can serve a stale aggregate. That makes the cache
// eventually consistent with a ceiling of one TTL, which is the trade the
// public read paths want; anything needing read-your-writes (the admin lists,
// `getTagsWithUsage`) deliberately does not go through here.

/** How long a cached entry stays fresh. Also the staleness ceiling across isolates. */
export const CACHE_TTL_MS = 60_000;

type Entry = { promise: Promise<unknown>; expiresAt: number };

const store = new Map<string, Entry>();

/**
 * Read `key` from the cache, running `load` on a miss.
 *
 * The PROMISE is stored, not the resolved value, so concurrent callers within
 * one request share a single query — that alone collapses the two
 * `getSiteSettings` reads every page does into one. A rejected load evicts
 * itself so a transient D1 error is not cached for a full TTL.
 */
export async function cached<T>(
  key: string,
  load: () => Promise<T>,
  ttlMs: number = CACHE_TTL_MS,
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.promise as Promise<T>;

  const promise = load();
  store.set(key, { promise, expiresAt: Date.now() + ttlMs });
  try {
    return await promise;
  } catch (err) {
    // Only evict if we are still the entry in the map: a later call may have
    // already replaced this one after the TTL lapsed.
    if (store.get(key)?.promise === promise) store.delete(key);
    throw err;
  }
}

/** Cache keys, kept here so the invalidation below can't drift from the reads. */
export const cacheKeys = {
  siteSettings: "site:settings",
  tagCounts: "tags:counts",
  tagsInSection: (sectionSlug: string) => `tags:section:${sectionSlug}`,
} as const;

/** Drop one entry. */
export function invalidate(key: string): void {
  store.delete(key);
}

/**
 * Drop every cached tag aggregate.
 *
 * Called by the mutations that feed those aggregates: posts, interview notes
 * and sections, and the tags themselves. Works are not a caller — they share
 * the `tags` table but no tag aggregate counts them; add the call here if that
 * ever changes. Deliberately
 * coarse — these entries cost one cheap query to rebuild, and a mutation is
 * rare enough that precision buys nothing but a way to forget a call site.
 * Site settings are NOT dropped here; `updateSiteSettings` invalidates its own
 * key, so a post edit doesn't throw away the settings read too.
 */
export function invalidateContentCaches(): void {
  for (const key of store.keys()) {
    if (key.startsWith("tags:")) store.delete(key);
  }
}

/** Full reset. For tests — the store outlives a module import between them. */
export function clearQueryCache(): void {
  store.clear();
}
