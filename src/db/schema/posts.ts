import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey().notNull(),
    slug: text("slug").unique().notNull(),
    title: text("title").notNull(),
    contentMd: text("content_md").notNull(),
    excerpt: text("excerpt"),
    coverImageUrl: text("cover_image_url"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index("idx_posts_status_published").on(table.status, table.publishedAt),
    index("idx_posts_slug").on(table.slug),
  ],
);
