import { sqliteTable, text, primaryKey, index } from "drizzle-orm/sqlite-core";
import { posts } from "./posts";

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey().notNull(),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
});

export const postTags = sqliteTable(
  "post_tags",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index("idx_post_tags_tag_id").on(table.tagId),
  ],
);
