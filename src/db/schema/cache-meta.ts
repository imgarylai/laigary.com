import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Cache bookkeeping. One row today: `content_version`, a counter every content
 * mutation bumps.
 *
 * The edge cache (see `src/start.ts`) folds this value into its cache key, so
 * bumping it retires every cached page at once — the Workers Cache API has no
 * purge-by-tag and no purge-all, and a key nobody asks for any more simply
 * ages out. Its own table rather than a `site_settings` row: `getSiteSettings`
 * returns its whole table as the settings map, and this is not a setting —
 * nothing edits it, nothing renders it, and it would show up in the admin form's
 * payload and in every caller that treats that map as the site's configuration.
 */
export const cacheMeta = sqliteTable("cache_meta", {
  key: text("key").primaryKey().notNull(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});
