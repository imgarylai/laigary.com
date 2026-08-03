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
// public read paths want; anything needing read-your-writes (the admin list
// ROWS, `getTagsWithUsage`) deliberately does not go through here.
//
// `adminNoteCount` is the one admin-path entry, and it is only the total the
// notes pager divides into page numbers — never the rows themselves. A count
// has to examine every row no matter which index serves it, so leaving it
// uncached would have made the page-20-rows change pointless. Worst case
// another isolate reports a page total that is one note stale for a TTL; the
// page the author is looking at is always live.

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
  interviewSections: "sections:all",
  sectionNoteCounts: "sections:noteCounts",
  adminNoteCount: "admin:noteCount",
  nextScheduledPublish: "meta:nextScheduledPublish",
} as const;

/** Drop one entry. */
export function invalidate(key: string): void {
  store.delete(key);
}

/**
 * Drop everything derived from content.
 *
 * Written as "everything EXCEPT the settings map" rather than as a list of
 * content prefixes, and that inversion is the point: the list version silently
 * failed to cover a key added later. Every entry here rebuilds with one cheap
 * query, and a mutation is rare, so the cost of being too coarse is nil — while
 * the cost of missing a key is a page that serves a stale count until the TTL
 * lapses.
 *
 * Site settings are the one exclusion: `updateSiteSettings` invalidates its own
 * key, so a post edit shouldn't throw away the settings read too.
 */
export function invalidateContentCaches(): void {
  for (const key of store.keys()) {
    if (key !== cacheKeys.siteSettings) store.delete(key);
  }
}

/** Full reset. For tests — the store outlives a module import between them. */
export function clearQueryCache(): void {
  store.clear();
}
