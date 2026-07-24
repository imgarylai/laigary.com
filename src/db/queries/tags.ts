import { eq, asc } from "drizzle-orm";
import { tags, postTags, interviewNoteTags, posts, interviewNotes } from "@/db/schema";
import { getDb } from "./_db";

export type UsedByItem = { type: "post" | "note"; title: string; slug: string };

// Resolve a tag by its slug — name + slug only, no usage. Returns null for an
// unknown slug. The /tags/$slug page uses this to get the display name before
// checking whether any published content carries the tag.
export async function getTagBySlug(slug: string): Promise<{ name: string; slug: string } | null> {
  const db = await getDb();
  const [row] = await db
    .select({ name: tags.name, slug: tags.slug })
    .from(tags)
    .where(eq(tags.slug, slug));
  return row ?? null;
}

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

  // Three constant-count queries instead of a per-tag fan-out (previously
  // 1 + 2N queries — a posts + notes lookup for every tag, i.e. an N+1 that
  // made the admin tags page stall on D1's per-query round-trips). Fetch the
  // full tag list plus all post/note usage joined once, then group in memory.
  const [allTags, postRows, noteRows] = await Promise.all([
    db.select().from(tags),
    db
      .select({ tagId: postTags.tagId, title: posts.title, slug: posts.slug })
      .from(postTags)
      .innerJoin(posts, eq(posts.id, postTags.postId)),
    db
      .select({
        tagId: interviewNoteTags.tagId,
        title: interviewNotes.title,
        slug: interviewNotes.slug,
      })
      .from(interviewNoteTags)
      .innerJoin(interviewNotes, eq(interviewNotes.id, interviewNoteTags.noteId)),
  ]);

  const postsByTag = new Map<string, UsedByItem[]>();
  for (const row of postRows) {
    const list = postsByTag.get(row.tagId) ?? [];
    list.push({ type: "post", title: row.title, slug: row.slug });
    postsByTag.set(row.tagId, list);
  }

  const notesByTag = new Map<string, UsedByItem[]>();
  for (const row of noteRows) {
    const list = notesByTag.get(row.tagId) ?? [];
    list.push({ type: "note", title: row.title, slug: row.slug });
    notesByTag.set(row.tagId, list);
  }

  return allTags.map((tag) => {
    const postUsage = postsByTag.get(tag.id) ?? [];
    const noteUsage = notesByTag.get(tag.id) ?? [];
    return {
      ...tag,
      postCount: postUsage.length,
      noteCount: noteUsage.length,
      usedBy: [...postUsage, ...noteUsage],
    };
  });
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
