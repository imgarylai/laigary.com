import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { tags } from "./tags";

export const interviewSections = sqliteTable("interview_sections", {
  id: text("id").primaryKey().notNull(),
  slug: text("slug").unique().notNull(),
  label: text("label").notNull(),
  blurb: text("blurb").notNull(),
  icon: text("icon").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const interviewNotes = sqliteTable(
  "interview_notes",
  {
    id: text("id").primaryKey().notNull(),
    slug: text("slug").notNull(),
    sectionId: text("section_id")
      .notNull()
      .references(() => interviewSections.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    contentMd: text("content_md").notNull().default(""),
    tags: text("tags"),
    status: text("status").notNull().default("draft"),
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
    index("idx_interview_notes_section").on(table.sectionId),
    index("idx_interview_notes_status_published").on(table.status, table.publishedAt),
    // Backs the section listing, which filters on (section_id, status) and
    // orders by (pinned, published_at). Without it SQLite scans the table and
    // sorts into a temp B-tree — 450 rows read to return 20. Key order matches
    // the query's; the DESC ordering is served by scanning the index backwards,
    // so the columns are stored ascending.
    index("idx_interview_notes_section_listing").on(
      table.sectionId,
      table.status,
      table.pinned,
      table.publishedAt,
    ),
    // Backs the admin notes table, which orders every unfiltered page by
    // `updated_at DESC`. A LIMIT does not make that cheap on its own: without
    // an index SQLite still has to read every row to find the newest 20, which
    // is how this list came to read ~900 rows per call (a full scan plus a temp
    // B-tree for the sort) to render one screen. Scanned backwards for DESC.
    //
    // Still needed even though `updated_at` is no longer the DEFAULT sort: it
    // is the Updated column, which is one header click away.
    index("idx_interview_notes_updated_at").on(table.updatedAt),
    // The same argument for `published_at`, which IS the default sort now — so
    // this is the index the unfiltered first page actually rides, and the one
    // whose absence would put that read volume straight back.
    index("idx_interview_notes_published_at").on(table.publishedAt),
  ],
);

export const interviewNoteTags = sqliteTable(
  "interview_note_tags",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => interviewNotes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.noteId, table.tagId] }),
    index("idx_interview_note_tags_tag_id").on(table.tagId),
  ],
);
