import { eq, asc } from "drizzle-orm";
import { tags, postTags, interviewNoteTags, posts, interviewNotes } from "@/db/schema";
import { getDb } from "./_db";

export type UsedByItem = { type: "post" | "note"; title: string; slug: string };

export type TagWithUsage = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  noteCount: number;
  usedBy: UsedByItem[];
};

export async function getTagsWithUsage(): Promise<TagWithUsage[]> {
  const db = await getDb();
  const allTags = await db.select().from(tags);

  return Promise.all(
    allTags.map(async (tag) => {
      const postResults = await db
        .select({ title: posts.title, slug: posts.slug })
        .from(postTags)
        .innerJoin(posts, eq(posts.id, postTags.postId))
        .where(eq(postTags.tagId, tag.id));

      const noteResults = await db
        .select({ title: interviewNotes.title, slug: interviewNotes.slug })
        .from(interviewNoteTags)
        .innerJoin(interviewNotes, eq(interviewNotes.id, interviewNoteTags.noteId))
        .where(eq(interviewNoteTags.tagId, tag.id));

      return {
        ...tag,
        postCount: postResults.length,
        noteCount: noteResults.length,
        usedBy: [
          ...postResults.map((p) => ({ type: "post" as const, title: p.title, slug: p.slug })),
          ...noteResults.map((n) => ({ type: "note" as const, title: n.title, slug: n.slug })),
        ],
      };
    }),
  );
}

export type Tag = { id: string; name: string; slug: string };

export class TagConflictError extends Error {
  constructor(message = "Tag already exists") {
    super(message);
    this.name = "TagConflictError";
  }
}

export class TagNotFoundError extends Error {
  constructor(id: string) {
    super(`Tag ${id} not found`);
    this.name = "TagNotFoundError";
  }
}

// Lean list of every tag (id/name/slug) for pickers like the post form's tag
// combobox — no usage joins, unlike getTagsWithUsage which the tags admin needs.
export async function getAllTags(): Promise<Tag[]> {
  const db = await getDb();
  return db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(tags)
    .orderBy(asc(tags.name));
}

export async function createTag(input: { name: string; slug: string }): Promise<Tag> {
  const db = await getDb();
  const id = crypto.randomUUID();
  try {
    await db.insert(tags).values({ id, name: input.name, slug: input.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new TagConflictError();
    throw err;
  }
  return { id, name: input.name, slug: input.slug };
}

// Slug intentionally cannot be updated — it's part of the public URL surface
// and renaming would break links. Only `name` is mutable.
export async function updateTag(id: string, input: { name: string }): Promise<Tag> {
  const db = await getDb();
  const [existing] = await db.select().from(tags).where(eq(tags.id, id));
  if (!existing) throw new TagNotFoundError(id);

  try {
    await db.update(tags).set({ name: input.name }).where(eq(tags.id, id));
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new TagConflictError("Tag name already exists");
    throw err;
  }
  return { id, name: input.name, slug: existing.slug };
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDb();
  // Check existence first instead of relying on driver-specific result shape
  // (D1 returns result.meta.changes; better-sqlite3 returns result.changes).
  const [existing] = await db.select({ id: tags.id }).from(tags).where(eq(tags.id, id));
  if (!existing) throw new TagNotFoundError(id);
  await db.delete(tags).where(eq(tags.id, id));
}
