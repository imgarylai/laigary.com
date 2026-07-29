import { eq } from "drizzle-orm";
import { siteSettings } from "@/db/schema";
import { getDb, runBatch, type BatchWrites } from "./_db";
import { cached, cacheKeys, invalidate } from "./_cache";

/**
 * The whole settings map.
 *
 * Cached (see `_cache.ts`): this is the single most-called query on the site —
 * every page reads it twice, once for the layout shell and once for
 * `pageChrome` — while the table itself is ~18 rows that change only when the
 * settings form is submitted.
 */
export async function getSiteSettings(): Promise<Record<string, string>> {
  return cached(cacheKeys.siteSettings, async () => {
    const db = await getDb();
    const rows = await db.select().from(siteSettings);
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  });
}

// Single key. Served off the cached map rather than its own SELECT — the map
// is one small query and is almost always already in the cache.
export async function getSiteSetting(key: string): Promise<string | null> {
  const settings = await getSiteSettings();
  return settings[key] ?? null;
}

export async function updateSiteSettings(values: Record<string, string>): Promise<void> {
  const entries = Object.entries(values);
  if (entries.length === 0) return;

  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  // One read for the whole map instead of one per key: `key` is the primary
  // key, and the settings table is small enough to enumerate.
  const rows = await db.select({ key: siteSettings.key }).from(siteSettings);
  const existing = new Set(rows.map((row) => row.key));

  // Every key lands or none does. Written key-by-key, a failure on the third
  // entry would leave the first two committed while the caller sees a rejected
  // promise — a half-applied settings form.
  const writes: BatchWrites = entries.map(([key, value]) =>
    existing.has(key)
      ? db.update(siteSettings).set({ value, updatedAt: now }).where(eq(siteSettings.key, key))
      : db.insert(siteSettings).values({ key, value }),
  );

  await runBatch(db, writes);
  invalidate(cacheKeys.siteSettings);
}
