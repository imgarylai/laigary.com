// Generic helper for fetching tags attached to a set of parent rows
// (posts or interview notes), batched to stay under D1's parameter cap.

import { eq } from "drizzle-orm";
import { tags, postTags, interviewNoteTags } from "@/db/schema";
import { chunk, inClause, type Db } from "./_db";

export type PostTag = { name: string; slug: string };

const JUNCTIONS = {
  post: { table: postTags, parentCol: postTags.postId, tagCol: postTags.tagId },
  note: {
    table: interviewNoteTags,
    parentCol: interviewNoteTags.noteId,
    tagCol: interviewNoteTags.tagId,
  },
} as const;

export type JunctionKind = keyof typeof JUNCTIONS;

export async function fetchTagsByParentIds(
  db: Db,
  kind: JunctionKind,
  parentIds: string[],
): Promise<Map<string, PostTag[]>> {
  const map = new Map<string, PostTag[]>();
  if (parentIds.length === 0) return map;

  const { table, parentCol, tagCol } = JUNCTIONS[kind];

  for (const batch of chunk(parentIds)) {
    const rows = await db
      .select({
        parentId: parentCol,
        tagName: tags.name,
        tagSlug: tags.slug,
      })
      .from(table)
      .innerJoin(tags, eq(tags.id, tagCol))
      .where(inClause(parentCol, batch));

    for (const row of rows) {
      const existing = map.get(row.parentId) ?? [];
      existing.push({ name: row.tagName, slug: row.tagSlug });
      map.set(row.parentId, existing);
    }
  }
  return map;
}
