import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const uploads = sqliteTable("uploads", {
  id: text("id").primaryKey().notNull(),
  r2Key: text("r2_key").unique().notNull(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedAt: integer("uploaded_at")
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});
