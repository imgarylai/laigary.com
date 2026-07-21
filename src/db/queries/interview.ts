import { eq, desc, count, and, asc } from "drizzle-orm";
import { interviewSections, interviewNotes, interviewNoteTags, tags } from "@/db/schema";
import { getDb, inClause, type Db } from "./_db";
import { fetchTagsByParentIds, type PostTag } from "./_tags";

export type InterviewNoteWithTags = {
  id: string;
  slug: string;
  sectionId: string;
  title: string;
  contentMd: string;
  status: string;
  publishedAt: number | null;
  tags: PostTag[];
  createdAt: number;
  updatedAt: number;
};

type RawNote = {
  id: string;
  slug: string;
  sectionId: string;
  title: string;
  contentMd: string;
  status: string;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

async function attachTags(db: Db, notes: RawNote[]): Promise<InterviewNoteWithTags[]> {
  const tagMap = await fetchTagsByParentIds(
    db,
    "note",
    notes.map((n) => n.id),
  );
  return notes.map((n) => ({
    id: n.id,
    slug: n.slug,
    sectionId: n.sectionId,
    title: n.title,
    contentMd: n.contentMd,
    status: n.status,
    publishedAt: n.publishedAt,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    tags: tagMap.get(n.id) ?? [],
  }));
}

export async function getInterviewSections() {
  const db = await getDb();
  return db.select().from(interviewSections).orderBy(asc(interviewSections.sortOrder));
}

export async function getInterviewSectionBySlug(slug: string) {
  const db = await getDb();
  const [section] = await db
    .select()
    .from(interviewSections)
    .where(eq(interviewSections.slug, slug));
  return section ?? null;
}

export async function getInterviewNoteCountsBySection(): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db
    .select({ sectionId: interviewNotes.sectionId, total: count() })
    .from(interviewNotes)
    .where(eq(interviewNotes.status, "published"))
    .groupBy(interviewNotes.sectionId);
  return new Map(rows.map((r) => [r.sectionId, r.total]));
}

export async function getRecentInterviewNotes(limit: number): Promise<InterviewNoteWithTags[]> {
  const db = await getDb();
  const notes = await db
    .select()
    .from(interviewNotes)
    .where(eq(interviewNotes.status, "published"))
    .orderBy(desc(interviewNotes.createdAt))
    .limit(limit);
  return attachTags(db, notes);
}

export async function getInterviewNotesBySection(
  sectionSlug: string,
  opts?: { tag?: string; limit?: number; offset?: number },
): Promise<{ notes: InterviewNoteWithTags[]; total: number }> {
  const db = await getDb();
  const section = await getInterviewSectionBySlug(sectionSlug);
  if (!section) return { notes: [], total: 0 };

  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  // Resolve tag filter to a list of note ids first.
  let tagNoteIds: string[] | null = null;
  if (opts?.tag) {
    const tagResult = await db
      .select({ noteId: interviewNoteTags.noteId })
      .from(interviewNoteTags)
      .innerJoin(tags, eq(tags.id, interviewNoteTags.tagId))
      .where(eq(tags.slug, opts.tag));
    tagNoteIds = tagResult.map((r) => r.noteId);
    if (tagNoteIds.length === 0) return { notes: [], total: 0 };
  }

  const baseConditions = [
    eq(interviewNotes.sectionId, section.id),
    eq(interviewNotes.status, "published"),
  ];
  const where = tagNoteIds
    ? and(...baseConditions, inClause(interviewNotes.id, tagNoteIds))
    : and(...baseConditions);

  const [{ total }] = await db.select({ total: count() }).from(interviewNotes).where(where);

  const rows = await db
    .select()
    .from(interviewNotes)
    .where(where)
    .orderBy(desc(interviewNotes.createdAt))
    .limit(limit)
    .offset(offset);

  const notes = await attachTags(db, rows);
  return { notes, total };
}

export async function getTagsInSection(
  sectionSlug: string,
): Promise<{ name: string; slug: string }[]> {
  const db = await getDb();
  const section = await getInterviewSectionBySlug(sectionSlug);
  if (!section) return [];
  const rows = await db
    .selectDistinct({ name: tags.name, slug: tags.slug })
    .from(interviewNoteTags)
    .innerJoin(tags, eq(tags.id, interviewNoteTags.tagId))
    .innerJoin(interviewNotes, eq(interviewNotes.id, interviewNoteTags.noteId))
    .where(and(eq(interviewNotes.sectionId, section.id), eq(interviewNotes.status, "published")))
    .orderBy(asc(tags.name));
  return rows;
}

export type AdminInterviewNote = {
  id: string;
  title: string;
  status: string;
  sectionId: string;
  sectionLabel: string;
};

export async function getAdminInterviewNotes(opts?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: AdminInterviewNote[]; total: number }> {
  const db = await getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const [{ total }] = await db.select({ total: count() }).from(interviewNotes);

  const rows = await db
    .select({
      id: interviewNotes.id,
      title: interviewNotes.title,
      status: interviewNotes.status,
      sectionId: interviewNotes.sectionId,
      sectionLabel: interviewSections.label,
    })
    .from(interviewNotes)
    .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
    .orderBy(desc(interviewNotes.updatedAt))
    .limit(limit)
    .offset(offset);

  return { items: rows, total };
}

// Every note (all sections/statuses) for the admin table, newest first. The
// admin table searches / sorts / paginates client-side, so it takes the full
// set — same pattern as posts.
export async function getAllAdminInterviewNotes(): Promise<AdminInterviewNote[]> {
  const db = await getDb();
  return db
    .select({
      id: interviewNotes.id,
      title: interviewNotes.title,
      status: interviewNotes.status,
      sectionId: interviewNotes.sectionId,
      sectionLabel: interviewSections.label,
    })
    .from(interviewNotes)
    .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
    .orderBy(desc(interviewNotes.updatedAt));
}

export class SectionConflictError extends Error {
  constructor(message = "Section slug already exists") {
    super(message);
    this.name = "SectionConflictError";
  }
}

export class SectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Section ${id} not found`);
    this.name = "SectionNotFoundError";
  }
}

export class NoteConflictError extends Error {
  constructor(message = "Note slug already exists in this section") {
    super(message);
    this.name = "NoteConflictError";
  }
}

export class NoteNotFoundError extends Error {
  constructor(id: string) {
    super(`Note ${id} not found`);
    this.name = "NoteNotFoundError";
  }
}

export async function createSection(input: {
  slug: string;
  label: string;
  blurb: string;
  icon: string;
  sortOrder?: number;
}): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const id = crypto.randomUUID();
  try {
    await db.insert(interviewSections).values({
      id,
      slug: input.slug,
      label: input.label,
      blurb: input.blurb,
      icon: input.icon,
      sortOrder: input.sortOrder ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new SectionConflictError();
    throw err;
  }
  return { id, slug: input.slug };
}

export async function updateSection(
  id: string,
  input: { label?: string; blurb?: string; icon?: string; sortOrder?: number },
): Promise<void> {
  const db = await getDb();
  const [existing] = await db.select().from(interviewSections).where(eq(interviewSections.id, id));
  if (!existing) throw new SectionNotFoundError(id);

  await db
    .update(interviewSections)
    .set({
      label: input.label ?? existing.label,
      blurb: input.blurb ?? existing.blurb,
      icon: input.icon ?? existing.icon,
      sortOrder: input.sortOrder ?? existing.sortOrder,
    })
    .where(eq(interviewSections.id, id));
}

export async function deleteSection(id: string): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: interviewSections.id })
    .from(interviewSections)
    .where(eq(interviewSections.id, id));
  if (!existing) throw new SectionNotFoundError(id);
  await db.delete(interviewSections).where(eq(interviewSections.id, id));
}

type NoteMutationInput = {
  slug: string;
  sectionId: string;
  title: string;
  contentMd?: string;
  status?: "draft" | "published";
  tagIds?: string[];
};

export async function createNote(input: NoteMutationInput): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const status = input.status ?? "draft";
  const publishedAt = status === "published" ? Math.floor(Date.now() / 1000) : null;

  try {
    await db.insert(interviewNotes).values({
      id,
      slug: input.slug,
      sectionId: input.sectionId,
      title: input.title,
      contentMd: input.contentMd ?? "",
      status,
      publishedAt,
    });
    if (input.tagIds && input.tagIds.length > 0) {
      await db
        .insert(interviewNoteTags)
        .values(input.tagIds.map((tagId) => ({ noteId: id, tagId })));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new NoteConflictError();
    throw err;
  }
  return { id, slug: input.slug };
}

export async function updateNote(
  id: string,
  input: Partial<Omit<NoteMutationInput, "sectionId">>,
): Promise<void> {
  const db = await getDb();
  const [existing] = await db.select().from(interviewNotes).where(eq(interviewNotes.id, id));
  if (!existing) throw new NoteNotFoundError(id);

  const newStatus = input.status ?? existing.status;
  let publishedAt = existing.publishedAt;
  if (newStatus === "published" && existing.status !== "published") {
    publishedAt = Math.floor(Date.now() / 1000);
  }

  try {
    await db
      .update(interviewNotes)
      .set({
        slug: input.slug ?? existing.slug,
        title: input.title ?? existing.title,
        contentMd: input.contentMd ?? existing.contentMd,
        status: newStatus,
        publishedAt,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(interviewNotes.id, id));
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new NoteConflictError();
    throw err;
  }

  if (input.tagIds !== undefined) {
    await db.delete(interviewNoteTags).where(eq(interviewNoteTags.noteId, id));
    if (input.tagIds.length > 0) {
      await db
        .insert(interviewNoteTags)
        .values(input.tagIds.map((tagId) => ({ noteId: id, tagId })));
    }
  }
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: interviewNotes.id })
    .from(interviewNotes)
    .where(eq(interviewNotes.id, id));
  if (!existing) throw new NoteNotFoundError(id);
  await db.delete(interviewNotes).where(eq(interviewNotes.id, id));
}

export async function getInterviewNote(
  sectionSlug: string,
  noteSlug: string,
): Promise<InterviewNoteWithTags | null> {
  const db = await getDb();
  const section = await getInterviewSectionBySlug(sectionSlug);
  if (!section) return null;
  const [note] = await db
    .select()
    .from(interviewNotes)
    .where(
      and(
        eq(interviewNotes.sectionId, section.id),
        eq(interviewNotes.slug, noteSlug),
        eq(interviewNotes.status, "published"),
      ),
    );
  if (!note) return null;
  const [withTags] = await attachTags(db, [note]);
  return withTags;
}

// Admin variant: bypasses the published filter so the editor can load drafts.
export async function getInterviewNoteById(id: string): Promise<InterviewNoteWithTags | null> {
  const db = await getDb();
  const [note] = await db.select().from(interviewNotes).where(eq(interviewNotes.id, id));
  if (!note) return null;
  const [withTags] = await attachTags(db, [note]);
  return withTags;
}
