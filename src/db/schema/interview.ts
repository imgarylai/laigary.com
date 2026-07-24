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
