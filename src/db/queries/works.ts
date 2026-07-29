import { eq, desc, count, and, like, type SQL } from "drizzle-orm";
import { works, workTags, tags } from "@/db/schema";
import { unixToIso } from "@/lib/date";
import { getDb, inClause, runBatch, type BatchWrites } from "./_db";
import { fetchTagsByParentIds, type PostTag } from "./_tags";
import { revalidateContent } from "./_revalidate";

export type PublicWork = {
  slug: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  role: string | null;
  year: number;
  endYear: number | null;
  date: string;
  pinned: boolean;
  tags: PostTag[];
};

export type PublicWorkDetail = PublicWork & {
  contentMd: string;
  updatedAt: string;
};

export async function getPublishedWorks(opts?: {
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<{ works: PublicWork[]; total: number }> {
  const db = await getDb();
  const limit = opts?.limit ?? 100;
  const offset = opts?.offset ?? 0;

  // Resolve the tag filter to a list of work ids first, same as the posts feed.
  let tagWorkIds: string[] | null = null;
  if (opts?.tag) {
    const tagResult = await db
      .select({ workId: workTags.workId })
      .from(workTags)
      .innerJoin(tags, eq(tags.id, workTags.tagId))
      .where(eq(tags.slug, opts.tag));
    tagWorkIds = tagResult.map((r) => r.workId);
    if (tagWorkIds.length === 0) return { works: [], total: 0 };
  }

  const published = eq(works.status, "published");
  const where = tagWorkIds ? and(published, inClause(works.id, tagWorkIds)) : published;

  const [{ total }] = await db.select({ total: count() }).from(works).where(where);

  const rows = await db
    .select({
      id: works.id,
      slug: works.slug,
      title: works.title,
      summary: works.summary,
      coverImageUrl: works.coverImageUrl,
      projectUrl: works.projectUrl,
      repoUrl: works.repoUrl,
      role: works.role,
      year: works.year,
      endYear: works.endYear,
      pinned: works.pinned,
      publishedAt: works.publishedAt,
    })
    .from(works)
    .where(where)
    // Pinned-first here, unlike getPublishedPosts: that feed is deliberately
    // pure-recency because it also backs the home page's latest-post probe and
    // the tag pages, so the archive re-sorts client-side. This one has a single
    // consumer, so the portfolio's running order lives in SQL and /works needs
    // no separate pinned block.
    .orderBy(desc(works.pinned), desc(works.year), desc(works.publishedAt))
    .limit(limit)
    .offset(offset);

  const tagsByWork = await fetchTagsByParentIds(
    db,
    "work",
    rows.map((r) => r.id),
  );

  return {
    works: rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      coverImageUrl: r.coverImageUrl,
      projectUrl: r.projectUrl,
      repoUrl: r.repoUrl,
      role: r.role,
      year: r.year,
      endYear: r.endYear,
      date: r.publishedAt ? unixToIso(r.publishedAt) : unixToIso(0),
      pinned: r.pinned === 1,
      tags: tagsByWork.get(r.id) ?? [],
    })),
    total,
  };
}

export async function getWorkBySlug(slug: string): Promise<PublicWorkDetail | null> {
  const db = await getDb();
  const [work] = await db.select().from(works).where(eq(works.slug, slug));
  if (!work || work.status !== "published") return null;

  const tagMap = await fetchTagsByParentIds(db, "work", [work.id]);

  return {
    slug: work.slug,
    title: work.title,
    summary: work.summary,
    coverImageUrl: work.coverImageUrl,
    projectUrl: work.projectUrl,
    repoUrl: work.repoUrl,
    role: work.role,
    year: work.year,
    endYear: work.endYear,
    contentMd: work.contentMd,
    date: work.publishedAt ? unixToIso(work.publishedAt) : unixToIso(0),
    updatedAt: unixToIso(work.updatedAt),
    pinned: work.pinned === 1,
    tags: tagMap.get(work.id) ?? [],
  };
}

export class WorkConflictError extends Error {
  constructor(message = "Slug already exists") {
    super(message);
    this.name = "WorkConflictError";
  }
}

export class WorkNotFoundError extends Error {
  constructor(id: string) {
    super(`Work ${id} not found`);
    this.name = "WorkNotFoundError";
  }
}

type WorkMutationInput = {
  title: string;
  slug: string;
  summary?: string;
  contentMd?: string;
  coverImageUrl?: string | null;
  projectUrl?: string | null;
  repoUrl?: string | null;
  role?: string | null;
  year: number;
  endYear?: number | null;
  status?: "draft" | "published";
  pinned?: boolean;
  tagIds?: string[];
};

export async function createWork(input: WorkMutationInput): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const status = input.status ?? "draft";
  const publishedAt = status === "published" ? Math.floor(Date.now() / 1000) : null;

  // One unit with the tag insert below: a bad tagId must not leave an untagged
  // work behind after the caller has been told the create failed.
  const writes: BatchWrites = [
    db.insert(works).values({
      id,
      slug: input.slug,
      title: input.title,
      summary: input.summary ?? "",
      contentMd: input.contentMd ?? "",
      // `|| null` rather than `?? null`: the admin form sends "" for a cleared
      // upload or an empty URL field, and storing that empty string would later
      // render as an og:image of "".
      coverImageUrl: input.coverImageUrl || null,
      projectUrl: input.projectUrl || null,
      repoUrl: input.repoUrl || null,
      role: input.role || null,
      year: input.year,
      endYear: input.endYear ?? null,
      status,
      pinned: input.pinned ? 1 : 0,
      publishedAt,
    }),
  ];

  if (input.tagIds && input.tagIds.length > 0) {
    writes.push(db.insert(workTags).values(input.tagIds.map((tagId) => ({ workId: id, tagId }))));
  }

  try {
    await runBatch(db, writes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new WorkConflictError();
    throw err;
  }

  await revalidateContent();
  return { id, slug: input.slug };
}

export async function updateWork(
  id: string,
  input: Partial<WorkMutationInput>,
): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const [existing] = await db.select().from(works).where(eq(works.id, id));
  if (!existing) throw new WorkNotFoundError(id);

  const newStatus = input.status ?? existing.status;
  let publishedAt = existing.publishedAt;
  if (newStatus === "published" && existing.status !== "published") {
    publishedAt = Math.floor(Date.now() / 1000);
  }

  // Row edit and tag replacement are one unit: the tag write can fail on a
  // stale or bogus tagId, and committing the edit alone would leave the work
  // renamed with every tag detached while the caller is told the save failed.
  const writes: BatchWrites = [
    db
      .update(works)
      .set({
        title: input.title ?? existing.title,
        slug: input.slug ?? existing.slug,
        summary: input.summary ?? existing.summary,
        contentMd: input.contentMd ?? existing.contentMd,
        coverImageUrl:
          input.coverImageUrl !== undefined ? input.coverImageUrl || null : existing.coverImageUrl,
        projectUrl: input.projectUrl !== undefined ? input.projectUrl || null : existing.projectUrl,
        repoUrl: input.repoUrl !== undefined ? input.repoUrl || null : existing.repoUrl,
        role: input.role !== undefined ? input.role || null : existing.role,
        year: input.year ?? existing.year,
        // endYear is nullable and clearable, so `undefined` (field untouched)
        // and `null` (range collapsed to a single year) must stay distinct.
        endYear: input.endYear !== undefined ? input.endYear : existing.endYear,
        status: newStatus,
        // Only overwrite the flag when the caller sends it (undefined = leave
        // as is), so an edit that doesn't touch the pin control preserves it.
        pinned: input.pinned === undefined ? existing.pinned : input.pinned ? 1 : 0,
        publishedAt,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(works.id, id)),
  ];

  if (input.tagIds !== undefined) {
    writes.push(db.delete(workTags).where(eq(workTags.workId, id)));
    if (input.tagIds.length > 0) {
      writes.push(db.insert(workTags).values(input.tagIds.map((tagId) => ({ workId: id, tagId }))));
    }
  }

  try {
    await runBatch(db, writes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new WorkConflictError();
    throw err;
  }

  await revalidateContent();
  return { id, slug: input.slug ?? existing.slug };
}

export async function deleteWork(id: string): Promise<void> {
  const db = await getDb();
  const [existing] = await db.select({ id: works.id }).from(works).where(eq(works.id, id));
  if (!existing) throw new WorkNotFoundError(id);
  await db.delete(works).where(eq(works.id, id));
  await revalidateContent();
}

export type AdminWork = {
  id: string;
  slug: string;
  title: string;
  status: string;
  pinned: boolean;
  year: number;
  updatedAt: number;
};

export type AdminWorkDetail = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentMd: string;
  coverImageUrl: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  role: string | null;
  year: number;
  endYear: number | null;
  status: "draft" | "published";
  pinned: boolean;
  tagIds: string[];
};

// Full editable work for the admin edit form: raw fields (any status) plus the
// selected tag ids. Returns null when the id doesn't exist.
export async function getAdminWorkById(id: string): Promise<AdminWorkDetail | null> {
  const db = await getDb();
  const [work] = await db.select().from(works).where(eq(works.id, id));
  if (!work) return null;

  const tagRows = await db
    .select({ tagId: workTags.tagId })
    .from(workTags)
    .where(eq(workTags.workId, id));

  return {
    id: work.id,
    title: work.title,
    slug: work.slug,
    summary: work.summary,
    contentMd: work.contentMd,
    coverImageUrl: work.coverImageUrl,
    projectUrl: work.projectUrl,
    repoUrl: work.repoUrl,
    role: work.role,
    year: work.year,
    endYear: work.endYear,
    status: work.status,
    pinned: work.pinned === 1,
    tagIds: tagRows.map((r) => r.tagId),
  };
}

// Every work (all statuses) for the admin list, newest-edited first. The admin
// table searches / sorts / paginates client-side, so it takes the full set.
export async function getAllAdminWorks(): Promise<AdminWork[]> {
  const db = await getDb();
  return db
    .select({
      id: works.id,
      slug: works.slug,
      title: works.title,
      status: works.status,
      pinned: works.pinned,
      year: works.year,
      updatedAt: works.updatedAt,
    })
    .from(works)
    .orderBy(desc(works.updatedAt))
    .then((rows) => rows.map((r) => ({ ...r, pinned: r.pinned === 1 })));
}

export async function getAdminWorks(opts?: {
  q?: string;
  status?: "draft" | "published";
  limit?: number;
  offset?: number;
}): Promise<{ items: AdminWork[]; total: number }> {
  const db = await getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const conditions: SQL[] = [];
  if (opts?.q) conditions.push(like(works.title, `%${opts.q}%`));
  if (opts?.status) conditions.push(eq(works.status, opts.status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(works).where(where);

  const rows = await db
    .select({
      id: works.id,
      slug: works.slug,
      title: works.title,
      status: works.status,
      pinned: works.pinned,
      year: works.year,
      updatedAt: works.updatedAt,
    })
    .from(works)
    .where(where)
    .orderBy(desc(works.updatedAt))
    .limit(limit)
    .offset(offset);

  return { items: rows.map((r) => ({ ...r, pinned: r.pinned === 1 })), total };
}
