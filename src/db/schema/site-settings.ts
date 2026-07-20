import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey().notNull(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});
