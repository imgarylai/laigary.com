import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { tags } from "./tags";

export const works = sqliteTable(
  "works",
  {
    id: text("id").primaryKey().notNull(),
    slug: text("slug").unique().notNull(),
    title: text("title").notNull(),
    // The index row's entire content, and the og:description source. NOT NULL
    // (unlike posts.excerpt) because on /works this line IS the listing — a
    // null would render the row as a hole rather than as a shorter entry.
    summary: text("summary").notNull().default(""),
    // Defaults to "" like interviewNotes.content_md, not NOT NULL-without-
    // default like posts: a work can ship as a link plus a summary with no
    // case study written for it yet.
    contentMd: text("content_md").notNull().default(""),
    coverImageUrl: text("cover_image_url"),
    // Both nullable: some works are sites with no public repository, and some
    // are repositories with nothing deployed.
    projectUrl: text("project_url"),
    repoUrl: text("repo_url"),
    role: text("role"),
    // Editorial year, and the primary sort key after `pinned`. `end_year` null
    // means a single-year work; set, it renders as a range (2021–2023). Day
    // precision would be a spec nobody reads — `published_at` still carries
    // real time for sitemap lastmod and for tie-breaking within a year.
    year: integer("year").notNull(),
    endYear: integer("end_year"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    pinned: integer("pinned").notNull().default(0),
    publishedAt: integer("published_at"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index("idx_works_status_published").on(table.status, table.publishedAt),
    index("idx_works_slug").on(table.slug),
  ],
);

// Tech stack goes through the shared `tags` table rather than a TEXT column,
// so a work tagged `go` lands on /tags/go next to the posts about Go. Mirrors
// postTags / interviewNoteTags; fetchTagsByParentIds is already generic over
// these junctions.
export const workTags = sqliteTable(
  "work_tags",
  {
    workId: text("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.workId, table.tagId] }),
    index("idx_work_tags_tag_id").on(table.tagId),
  ],
);
