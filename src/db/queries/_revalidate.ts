// The one call every content mutation makes to say "what I just wrote is
// visible now". It drives both cache layers:
//
//   - the isolate-local query cache (`_cache.ts`), dropped synchronously, so
//     the isolate that performed the write reads its own result back;
//   - the edge cache (`src/start.ts`), retired by bumping `content_version`,
//     which is part of every cached page's key.

import { eq, sql } from "drizzle-orm";
import { cacheMeta } from "@/db/schema";
import { getDb } from "./_db";
import { cached, invalidate, invalidateContentCaches } from "./_cache";

const CONTENT_VERSION_KEY = "content_version";
const CONTENT_VERSION_CACHE_KEY = "meta:content_version";

/** A version for a database that has never been written to. */
const INITIAL_VERSION = "0";

/**
 * The current content version, as an opaque cache-key fragment.
 *
 * Read on every cacheable request, so it goes through the query cache: one row
 * by primary key, at most once per isolate per TTL. A missing row (a database
 * that predates the table, or one nobody has written to yet) is not an error —
 * it just means "version zero", which keys the edge cache perfectly well.
 */
export async function getContentVersion(): Promise<string> {
  return cached(CONTENT_VERSION_CACHE_KEY, async () => {
    const db = await getDb();
    const [row] = await db
      .select({ value: cacheMeta.value })
      .from(cacheMeta)
      .where(eq(cacheMeta.key, CONTENT_VERSION_KEY));
    return row?.value ?? INITIAL_VERSION;
  });
}

/**
 * Publish whatever was just written: drop the derived query caches and retire
 * every edge-cached page.
 *
 * Never throws. It runs after the mutation has already committed, so a failure
 * here has not lost the author's work — reporting it as a failed save would be
 * a lie that invites a retry, and the retry would fail on the duplicate slug.
 * The cost of swallowing is bounded: the edge serves the previous version of a
 * page until `CACHE_TTL_MS` lapses and the next mutation bumps again.
 */
export async function revalidateContent(): Promise<void> {
  invalidateContentCaches();
  invalidate(CONTENT_VERSION_CACHE_KEY);

  try {
    const db = await getDb();
    // A counter, not a timestamp: two publishes inside the same millisecond
    // would stamp the same version, and the second one's pages would keep
    // serving from the first one's cache entries.
    await db
      .insert(cacheMeta)
      .values({ key: CONTENT_VERSION_KEY, value: "1" })
      .onConflictDoUpdate({
        target: cacheMeta.key,
        set: {
          value: sql`CAST(${cacheMeta.value} AS INTEGER) + 1`,
          updatedAt: sql`(strftime('%s', 'now'))`,
        },
      });
  } catch {
    // Deliberately swallowed — see the note above.
  }
}
