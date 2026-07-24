import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const pages = sqliteTable(
  "pages",
  {
    id: text("id").primaryKey().notNull(),
    slug: text("slug").unique().notNull(),
    title: text("title").notNull(),
    contentMd: text("content_md").notNull(),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [index("idx_pages_slug").on(table.slug)],
);
