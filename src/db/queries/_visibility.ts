// What "published" means to a reader, in one place.
//
// A row is live when its status says published AND its `published_at` has
// arrived. That second half is the whole scheduling feature: the author picks
// the timestamp, and a future one simply means every public read filters the
// row out until the clock catches up. There is no cron, no publish job and no
// state to drift — the row is already correct, it just is not due yet.
//
// Two consequences worth knowing before you add a public query:
//
//   - `published_at` is NOT NULL for anything published (the
//     `publish_date_ordering` migration backfilled it from `created_at`, and
//     the mutations stamp it on every publish), so `lte` is safe to compare
//     against directly. A NULL would drop the row from the site.
//   - The comparison is against the request's own clock, so nothing needs
//     invalidating when a scheduled item comes due — except the caches, which
//     is what `getNextScheduledPublishAt` below is for.

import { and, eq, gt, lte, min, type SQL } from "drizzle-orm";
import { interviewNotes, posts } from "@/db/schema";
import { getDb } from "./_db";
import { cached, cacheKeys, invalidate } from "./_cache";

/** Now, in the unix seconds the content tables store. */
export function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

/** Posts a reader may see: published, and due. */
export function livePosts(now: number = unixNow()): SQL {
  return and(eq(posts.status, "published"), lte(posts.publishedAt, now))!;
}

/** Interview notes a reader may see: published, and due. */
export function liveNotes(now: number = unixNow()): SQL {
  return and(eq(interviewNotes.status, "published"), lte(interviewNotes.publishedAt, now))!;
}

/**
 * The `published_at` a write should store. Shared by posts and notes, which
 * carry the same publish model.
 *
 * The author's choice wins whenever they made one, including on a draft — a
 * date picked before the publish switch is flipped has to survive the save, or
 * scheduling would be impossible to set up in one pass. Anything published
 * without a date falls back to now, which keeps the column non-null for
 * everything the public reads.
 */
export function resolvePublishedAt(
  status: "draft" | "published",
  requested: number | null | undefined,
  existing: number | null,
): number | null {
  const chosen = requested === undefined ? existing : requested;
  if (chosen !== null) return chosen;
  return status === "published" ? unixNow() : null;
}

/**
 * When the next scheduled post or note comes due, or null when nothing is
 * waiting.
 *
 * The edge cache holds a public document for a day (`src/lib/http-cache.ts`),
 * retired early only by a content-version bump — and a scheduled item coming
 * due is precisely the one publish event that involves no write to bump it.
 * Without this the post would appear whenever the entry happened to expire.
 * `src/start.ts` caps `s-maxage` at the answer, so every stored document
 * expires no later than the moment its content would change.
 *
 * Cached like the other read-mostly queries, with one extra rule: a cached
 * answer that has already passed is exactly the case the cap must not miss, so
 * it is dropped and reloaded rather than served for the rest of its TTL.
 */
export async function getNextScheduledPublishAt(): Promise<number | null> {
  const hit = await cached(cacheKeys.nextScheduledPublish, loadNextScheduledPublishAt);
  if (hit !== null && hit <= unixNow()) {
    invalidate(cacheKeys.nextScheduledPublish);
    return cached(cacheKeys.nextScheduledPublish, loadNextScheduledPublishAt);
  }
  return hit;
}

async function loadNextScheduledPublishAt(): Promise<number | null> {
  const db = await getDb();
  const now = unixNow();
  const [postNext, noteNext] = await Promise.all([
    db
      .select({ at: min(posts.publishedAt) })
      .from(posts)
      .where(and(eq(posts.status, "published"), gt(posts.publishedAt, now))),
    db
      .select({ at: min(interviewNotes.publishedAt) })
      .from(interviewNotes)
      .where(and(eq(interviewNotes.status, "published"), gt(interviewNotes.publishedAt, now))),
  ]);

  // Indexed, not optional-chained: an aggregate with no GROUP BY always returns
  // exactly one row — `at` is NULL when nothing matched, which the filter
  // handles. `?.` here would be a branch nothing can take.
  const candidates = [postNext[0].at, noteNext[0].at].filter(
    (at): at is number => typeof at === "number",
  );
  return candidates.length > 0 ? Math.min(...candidates) : null;
}
