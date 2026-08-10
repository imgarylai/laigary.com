import { eq, desc, count, and, asc, like, sql, type SQL } from "drizzle-orm";
import { interviewSections, interviewNotes, interviewNoteTags, tags } from "@/db/schema";
import { unixToIso } from "@/lib/date";
import { getDb, inClause, runBatch, type BatchWrites, type Db } from "./_db";
import { fetchTagsByParentIds, type PostTag } from "./_tags";
import { cached, cacheKeys } from "./_cache";
import { revalidateContent } from "./_revalidate";
import { liveNotes, resolvePublishedAt, unixNow } from "./_visibility";

export type InterviewNoteWithTags = {
  id: string;
  slug: string;
  sectionId: string;
  title: string;
  contentMd: string;
  status: string;
  pinned: number;
  publishedAt: number | null;
  tags: PostTag[];
  createdAt: number;
  updatedAt: number;
};

/**
 * A note that has come back through `liveNotes()`.
 *
 * The only difference is that `publishedAt` is not nullable, and that is worth
 * a type rather than a `?? createdAt` at each of the four places a note's date
 * is rendered: those fallbacks read as handling a real case, when the filter
 * the row just passed (`published_at <= now`) means NULL cannot reach them. The
 * narrowing is asserted where the filter is applied, so the callers need no
 * assertion at all.
 */
export type LiveInterviewNote = Omit<InterviewNoteWithTags, "publishedAt"> & {
  publishedAt: number;
};

type RawNote = {
  id: string;
  slug: string;
  sectionId: string;
  title: string;
  contentMd: string;
  status: string;
  pinned: number;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

/**
 * Attach tags to rows that came back through `liveNotes()`, narrowing the
 * publish date to non-null. The cast is safe exactly because the caller's WHERE
 * compared `published_at` to a number — a NULL cannot have matched.
 */
async function attachTagsToLive(db: Db, notes: RawNote[]): Promise<LiveInterviewNote[]> {
  return (await attachTags(db, notes)) as LiveInterviewNote[];
}

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
    pinned: n.pinned,
    publishedAt: n.publishedAt,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    tags: tagMap.get(n.id) ?? [],
  }));
}

/**
 * Every section, in display order.
 *
 * Cached (see `_cache.ts`). A handful of rows, but the interview layout reads it
 * on every navigation in the sub-site and three admin forms read it too — it
 * was the second most-called query on the site at 4.4k calls in half an hour.
 */
export async function getInterviewSections() {
  return cached(cacheKeys.interviewSections, async () => {
    const db = await getDb();
    return db.select().from(interviewSections).orderBy(asc(interviewSections.sortOrder));
  });
}

export type NoteByTag = {
  slug: string;
  sectionSlug: string;
  sectionLabel: string;
  title: string;
  date: string;
};

// Published notes carrying a tag, across every section, newest first — backs
// the unified /tags/$slug page's interview section. Filters by tag slug (the
// canonical identifier), unlike the in-section browse filter which uses names.
export async function getPublishedNotesByTag(tagSlug: string): Promise<NoteByTag[]> {
  const db = await getDb();
  const rows = await db
    .select({
      slug: interviewNotes.slug,
      sectionSlug: interviewSections.slug,
      sectionLabel: interviewSections.label,
      title: interviewNotes.title,
      publishedAt: interviewNotes.publishedAt,
    })
    .from(interviewNoteTags)
    .innerJoin(tags, eq(tags.id, interviewNoteTags.tagId))
    .innerJoin(interviewNotes, eq(interviewNotes.id, interviewNoteTags.noteId))
    .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
    .where(and(eq(tags.slug, tagSlug), liveNotes()))
    .orderBy(desc(interviewNotes.publishedAt));

  return rows.map((r) => ({
    slug: r.slug,
    sectionSlug: r.sectionSlug,
    sectionLabel: r.sectionLabel,
    title: r.title,
    // Non-null by `liveNotes()` above — see `LiveInterviewNote`.
    date: unixToIso(r.publishedAt!),
  }));
}

export type PublishedNoteIndexEntry = { slug: string; sectionSlug: string; title: string };

// Flat title index of every published note (section order, newest first inside
// a section) — backs the /llms.txt content map.
export async function getPublishedNoteIndex(): Promise<PublishedNoteIndexEntry[]> {
  const db = await getDb();
  return db
    .select({
      slug: interviewNotes.slug,
      sectionSlug: interviewSections.slug,
      title: interviewNotes.title,
    })
    .from(interviewNotes)
    .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
    .where(liveNotes())
    .orderBy(asc(interviewSections.sortOrder), desc(interviewNotes.publishedAt));
}

export async function getInterviewSectionBySlug(slug: string) {
  const db = await getDb();
  const [section] = await db
    .select()
    .from(interviewSections)
    .where(eq(interviewSections.slug, slug));
  return section ?? null;
}

/**
 * Published note count per section.
 *
 * Cached (see `_cache.ts`), and it has to be: counting every published note
 * means examining every row, so the cost is one row read per note in the corpus
 * no matter which index serves it. At ~900 notes and 5.3k calls in half an hour
 * this query alone read 4.79M rows — 73% of the database's entire read volume —
 * to return three numbers that only change when a note is written.
 *
 * Not fixable with an index: `status = 'published'` matches nearly every row,
 * so there is nothing to narrow. Not recomputing it per request is the only
 * lever there is.
 */
export async function getInterviewNoteCountsBySection(): Promise<Map<string, number>> {
  return cached(cacheKeys.sectionNoteCounts, async () => {
    const db = await getDb();
    const rows = await db
      .select({ sectionId: interviewNotes.sectionId, total: count() })
      .from(interviewNotes)
      .where(liveNotes())
      .groupBy(interviewNotes.sectionId);
    return new Map(rows.map((r) => [r.sectionId, r.total]));
  });
}

export async function getRecentInterviewNotes(limit: number): Promise<LiveInterviewNote[]> {
  const db = await getDb();
  const notes = await db
    .select()
    .from(interviewNotes)
    .where(liveNotes())
    .orderBy(desc(interviewNotes.publishedAt))
    .limit(limit);
  return attachTagsToLive(db, notes);
}

export type SectionNotesOptions = {
  /** Filter by tag slug — the canonical identifier, used by internal callers. */
  tag?: string;
  /**
   * Filter by tag NAME. The section page's `?tag=` chips carry names (that is
   * what the URLs already indexed point at), and a name is not derivable from
   * a slug without another lookup, so the filter accepts either identifier
   * rather than making the caller translate.
   */
  tagName?: string;
  /**
   * Leave pinned notes out. The section page renders them in their own block
   * above the chronological list, so including them here would show them
   * twice — and paginating a list whose first rows are pinned would push a
   * different note off page 1 on every pin.
   */
  excludePinned?: boolean;
  limit?: number;
  offset?: number;
};

/**
 * One page of a section's published notes, plus the unpaginated total.
 *
 * `limit` is a real page size, not a "fetch everything" ceiling: the caller
 * used to ask for 500 and slice in the browser, which made every section view
 * (and every hover preload of one) read the whole table — `content_md`
 * included — to render 20 rows.
 */
export async function getInterviewNotesBySection(
  sectionSlug: string,
  opts?: SectionNotesOptions,
): Promise<{ notes: LiveInterviewNote[]; total: number }> {
  const db = await getDb();
  const section = await getInterviewSectionBySlug(sectionSlug);
  if (!section) return { notes: [], total: 0 };

  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  // Resolve tag filter to a list of note ids first.
  let tagNoteIds: string[] | null = null;
  if (opts?.tag || opts?.tagName) {
    const tagResult = await db
      .select({ noteId: interviewNoteTags.noteId })
      .from(interviewNoteTags)
      .innerJoin(tags, eq(tags.id, interviewNoteTags.tagId))
      .where(opts.tag ? eq(tags.slug, opts.tag) : eq(tags.name, opts.tagName!));
    tagNoteIds = tagResult.map((r) => r.noteId);
    if (tagNoteIds.length === 0) return { notes: [], total: 0 };
  }

  const conditions = [eq(interviewNotes.sectionId, section.id), liveNotes()];
  if (opts?.excludePinned) conditions.push(eq(interviewNotes.pinned, 0));
  if (tagNoteIds) conditions.push(inClause(interviewNotes.id, tagNoteIds));
  const where = and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(interviewNotes).where(where);

  const rows = await db
    .select()
    .from(interviewNotes)
    .where(where)
    .orderBy(desc(interviewNotes.pinned), desc(interviewNotes.publishedAt))
    .limit(limit)
    .offset(offset);

  const notes = await attachTagsToLive(db, rows);
  return { notes, total };
}

// The section page's pinned block: every pinned published note in the section,
// newest first. Its own query because the block sits outside pagination — it
// renders in full on page 1 and not at all on the rest.
export async function getPinnedInterviewNotes(sectionSlug: string): Promise<LiveInterviewNote[]> {
  const db = await getDb();
  const section = await getInterviewSectionBySlug(sectionSlug);
  if (!section) return [];

  const rows = await db
    .select()
    .from(interviewNotes)
    .where(and(eq(interviewNotes.sectionId, section.id), liveNotes(), eq(interviewNotes.pinned, 1)))
    .orderBy(desc(interviewNotes.publishedAt));

  return attachTagsToLive(db, rows);
}

// Cross-section title search for published notes — backs the ⌘K palette's
// on-demand content search (the palette no longer pre-loads every note). Title
// only, matching the posts search; ordered newest-first, capped by `limit`.
export async function searchPublishedInterviewNotes(
  query: string,
  limit = 20,
): Promise<{ slug: string; section: string; title: string }[]> {
  const db = await getDb();
  return db
    .select({
      slug: interviewNotes.slug,
      title: interviewNotes.title,
      section: interviewSections.slug,
    })
    .from(interviewNotes)
    .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
    .where(and(liveNotes(), like(interviewNotes.title, `%${query}%`)))
    .orderBy(desc(interviewNotes.publishedAt))
    .limit(limit);
}

// Admin title search across every section and status (the editor's link
// dialog links to drafts too — the UI badges them). Newest-edited first.
export async function searchAdminInterviewNotes(
  query: string,
  limit = 10,
): Promise<{ slug: string; title: string; status: string; sectionSlug: string }[]> {
  const db = await getDb();
  return db
    .select({
      slug: interviewNotes.slug,
      title: interviewNotes.title,
      status: interviewNotes.status,
      sectionSlug: interviewSections.slug,
    })
    .from(interviewNotes)
    .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
    .where(like(interviewNotes.title, `%${query}%`))
    .orderBy(desc(interviewNotes.updatedAt))
    .limit(limit);
}

export async function getTagsInSection(
  sectionSlug: string,
): Promise<{ name: string; slug: string }[]> {
  return cached(cacheKeys.tagsInSection(sectionSlug), () => loadTagsInSection(sectionSlug));
}

// Cached (see `_cache.ts`). SQLite drives this join from `interview_notes` and
// scans it whole — every published note in the section, then a junction and a
// tags lookup each — so the ~30 chips this returns cost ~2k rows read. The
// section filter narrows nothing when a section holds the entire corpus.
async function loadTagsInSection(sectionSlug: string): Promise<{ name: string; slug: string }[]> {
  const db = await getDb();
  const section = await getInterviewSectionBySlug(sectionSlug);
  if (!section) return [];
  const rows = await db
    .selectDistinct({ name: tags.name, slug: tags.slug })
    .from(interviewNoteTags)
    .innerJoin(tags, eq(tags.id, interviewNoteTags.tagId))
    .innerJoin(interviewNotes, eq(interviewNotes.id, interviewNoteTags.noteId))
    .where(and(eq(interviewNotes.sectionId, section.id), liveNotes()))
    .orderBy(asc(tags.name));
  return rows;
}

export type AdminInterviewNote = {
  id: string;
  slug: string;
  title: string;
  status: string;
  pinned: boolean;
  publishedAt: number | null;
  sectionId: string;
  sectionLabel: string;
  sectionSlug: string;
};

/** Rows per page in the admin notes table. Shared by the query and the pager. */
export const ADMIN_NOTES_PAGE_SIZE = 20;

/** Sortable columns of the admin notes table, mapped to what SQL orders by. */
const ADMIN_NOTE_SORTS = {
  publishedAt: interviewNotes.publishedAt,
  updatedAt: interviewNotes.updatedAt,
  title: interviewNotes.title,
  status: interviewNotes.status,
  sectionLabel: interviewSections.label,
} as const;

export type AdminNoteSort = keyof typeof ADMIN_NOTE_SORTS;

export function isAdminNoteSort(value: unknown): value is AdminNoteSort {
  return typeof value === "string" && value in ADMIN_NOTE_SORTS;
}

/**
 * One page of the admin notes table, filtered and sorted in SQL.
 *
 * This list used to load every note and search / sort / paginate in the
 * browser. That is a fine default at this scale, but the admin routes are not
 * edge-cached and the router preloads a route on hover, so the loader ran far
 * more often than the author actually opened the page — 14k calls in 12 hours,
 * each reading ~900 rows to render 20 of them (a full scan, then a temp B-tree
 * for the sort), which came to 87% of the database's entire read volume.
 *
 * Three things make the page cheap, and all three are needed:
 *   - LIMIT/OFFSET, so a page costs a page.
 *   - an index on the default sort column, without which the ordering still
 *     reads every row to find the newest 20. That is
 *     `idx_interview_notes_published_at` now the default is publish date;
 *     `idx_interview_notes_updated_at` still backs the Updated column.
 *   - a cached total (see `countAdminNotes`), because COUNT examines every row
 *     whatever the LIMIT is.
 *
 * The section JOIN is back. It was split into a second query when this loaded
 * the whole table, where SQLite charged a section lookup per note and tripled
 * the rows read; against 20 rows that cost is 20 lookups, and the join buys
 * back sorting by section label — which an in-memory join cannot do, since it
 * only sees the page SQL already chose.
 */
export async function getAdminInterviewNotes(opts?: {
  /** Case-insensitive substring match on the title. */
  q?: string;
  /** Restrict to one section, by id (the route resolves the slug it shows). */
  sectionId?: string;
  status?: string;
  sort?: AdminNoteSort;
  dir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}): Promise<{ items: AdminInterviewNote[]; total: number }> {
  const db = await getDb();
  const limit = opts?.limit ?? ADMIN_NOTES_PAGE_SIZE;
  const offset = opts?.offset ?? 0;
  const q = opts?.q?.trim() || undefined;
  // Every filter narrows both the page and the total, so they are built once
  // and handed to both queries — a pager that divides an unfiltered total pages
  // over rows the filtered query will not return.
  const conditions = [
    q ? like(interviewNotes.title, `%${q}%`) : undefined,
    opts?.sectionId ? eq(interviewNotes.sectionId, opts.sectionId) : undefined,
    opts?.status ? eq(interviewNotes.status, opts.status) : undefined,
  ].filter((c) => c !== undefined);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Newest-PUBLISHED first is the default: the table mirrors the order readers
  // see, so a typo fix does not move a note. (It was newest-EDITED, which is
  // what made a two-year-old note jump to the top of the list on a fix.)
  const sortKey = opts?.sort ?? "publishedAt";
  const direction = opts?.dir === "asc" ? asc : desc;
  // Drafts carry no publish date, and SQLite sorts NULL first — on the default
  // descending order that would stack every draft above the whole archive.
  // `updated_at` then breaks ties inside that block, so the draft last worked
  // on leads it.
  const orderBy =
    sortKey === "publishedAt"
      ? [
          sql`${interviewNotes.publishedAt} IS NULL`,
          direction(interviewNotes.publishedAt),
          desc(interviewNotes.updatedAt),
        ]
      : [direction(ADMIN_NOTE_SORTS[sortKey])];

  const [rows, total] = await Promise.all([
    db
      .select({
        id: interviewNotes.id,
        slug: interviewNotes.slug,
        title: interviewNotes.title,
        status: interviewNotes.status,
        pinned: interviewNotes.pinned,
        publishedAt: interviewNotes.publishedAt,
        sectionId: interviewNotes.sectionId,
        sectionLabel: interviewSections.label,
        sectionSlug: interviewSections.slug,
      })
      .from(interviewNotes)
      .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    countAdminNotes(where),
  ]);

  return { items: rows.map((r) => ({ ...r, pinned: r.pinned === 1 })), total };
}

/**
 * Total rows behind the admin notes pager.
 *
 * The unfiltered total is cached: it changes only when the author writes (and
 * every write calls `revalidateContent`), while the pager asks for it on every
 * page view. A filtered total is not cached — the key space is whatever the
 * author typed or picked, and reaching for a filter is a deliberate act rather
 * than a hover.
 */
async function countAdminNotes(where?: SQL): Promise<number> {
  const load = async () => {
    const db = await getDb();
    const [row] = await db.select({ total: count() }).from(interviewNotes).where(where);
    return row.total;
  };
  return where ? load() : cached(cacheKeys.adminNoteCount, load);
}

/**
 * Resolve a (section slug, note slug) pair to a note id, drafts included.
 *
 * The MCP write tools address notes the way a URL does, but act on them by id.
 * They used to bridge that by loading every note and running `.find()` over the
 * result — the whole table read to identify one row.
 */
export async function getInterviewNoteIdBySlug(
  sectionSlug: string,
  noteSlug: string,
): Promise<string | null> {
  const db = await getDb();
  const [row] = await db
    .select({ id: interviewNotes.id })
    .from(interviewNotes)
    .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
    .where(and(eq(interviewSections.slug, sectionSlug), eq(interviewNotes.slug, noteSlug)))
    .limit(1);
  return row?.id ?? null;
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
  await revalidateContent();
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
  await revalidateContent();
}

export async function deleteSection(id: string): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: interviewSections.id })
    .from(interviewSections)
    .where(eq(interviewSections.id, id));
  if (!existing) throw new SectionNotFoundError(id);
  await db.delete(interviewSections).where(eq(interviewSections.id, id));
  await revalidateContent();
}

type NoteMutationInput = {
  slug: string;
  sectionId: string;
  title: string;
  contentMd?: string;
  status?: "draft" | "published";
  pinned?: boolean;
  /** Same three-valued contract as a post's — see `resolvePublishedAt`. */
  publishedAt?: number | null;
  tagIds?: string[];
};

export async function createNote(input: NoteMutationInput): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const status = input.status ?? "draft";
  const publishedAt = resolvePublishedAt(status, input.publishedAt, null);

  // One unit with the tag insert below — see createPost for why.
  const writes: BatchWrites = [
    db.insert(interviewNotes).values({
      id,
      slug: input.slug,
      sectionId: input.sectionId,
      title: input.title,
      contentMd: input.contentMd ?? "",
      status,
      pinned: input.pinned ? 1 : 0,
      publishedAt,
    }),
  ];

  if (input.tagIds && input.tagIds.length > 0) {
    writes.push(
      db.insert(interviewNoteTags).values(input.tagIds.map((tagId) => ({ noteId: id, tagId }))),
    );
  }

  try {
    await runBatch(db, writes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new NoteConflictError();
    throw err;
  }
  await revalidateContent();
  return { id, slug: input.slug };
}

export type UpdateNoteOptions = {
  /**
   * Whether to stamp `updatedAt` with the current time. Defaults to true.
   *
   * Pass false for corrections that should not surface the note as freshly
   * written — fixing a typo or a broken link is not new content. Listings order
   * by `publishedAt` now, so this no longer reorders them; what it still
   * governs is the sitemap's `lastmod` and the "modified" date on the page.
   */
  touchUpdatedAt?: boolean;
};

export async function updateNote(
  id: string,
  input: Partial<NoteMutationInput>,
  options: UpdateNoteOptions = {},
): Promise<void> {
  const { touchUpdatedAt = true } = options;
  const db = await getDb();
  const [existing] = await db.select().from(interviewNotes).where(eq(interviewNotes.id, id));
  if (!existing) throw new NoteNotFoundError(id);

  const newStatus = input.status ?? existing.status;
  const publishedAt = resolvePublishedAt(
    newStatus as "draft" | "published",
    input.publishedAt,
    existing.publishedAt,
  );

  // Row edit and tag replacement are one unit — see updatePost. Note the tag
  // writes previously sat outside the try/catch entirely, so a failure there
  // did not even get the conflict mapping.
  const writes: BatchWrites = [
    db
      .update(interviewNotes)
      .set({
        slug: input.slug ?? existing.slug,
        // Moving a note between sections changes its public URL, so the old one
        // 404s from here on. UNIQUE(section_id, slug) still guards the landing
        // spot — a slug already taken in the target section surfaces as a
        // NoteConflictError below, same as renaming into a taken slug.
        sectionId: input.sectionId ?? existing.sectionId,
        title: input.title ?? existing.title,
        contentMd: input.contentMd ?? existing.contentMd,
        status: newStatus,
        pinned: input.pinned === undefined ? existing.pinned : input.pinned ? 1 : 0,
        publishedAt,
        // Omitted entirely (not set to the old value) when preserving, so the
        // column keeps whatever is already stored.
        ...(touchUpdatedAt ? { updatedAt: unixNow() } : {}),
      })
      .where(eq(interviewNotes.id, id)),
  ];

  if (input.tagIds !== undefined) {
    writes.push(db.delete(interviewNoteTags).where(eq(interviewNoteTags.noteId, id)));
    if (input.tagIds.length > 0) {
      writes.push(
        db.insert(interviewNoteTags).values(input.tagIds.map((tagId) => ({ noteId: id, tagId }))),
      );
    }
  }

  try {
    await runBatch(db, writes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new NoteConflictError();
    throw err;
  }
  await revalidateContent();
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: interviewNotes.id })
    .from(interviewNotes)
    .where(eq(interviewNotes.id, id));
  if (!existing) throw new NoteNotFoundError(id);
  await db.delete(interviewNotes).where(eq(interviewNotes.id, id));
  await revalidateContent();
}

export async function getInterviewNote(
  sectionSlug: string,
  noteSlug: string,
): Promise<LiveInterviewNote | null> {
  const db = await getDb();
  const section = await getInterviewSectionBySlug(sectionSlug);
  if (!section) return null;
  const [note] = await db
    .select()
    .from(interviewNotes)
    // A scheduled note has no public page before its date — the direct URL has
    // to 404 like a draft's does, or the listing filter would only be a
    // formality.
    .where(
      and(eq(interviewNotes.sectionId, section.id), eq(interviewNotes.slug, noteSlug), liveNotes()),
    );
  if (!note) return null;
  const [withTags] = await attachTagsToLive(db, [note]);
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
