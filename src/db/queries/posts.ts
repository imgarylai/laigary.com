import { eq, desc, count, and, like, type SQL } from "drizzle-orm";
import { posts, tags, postTags } from "@/db/schema";
import { computeReadingTime, unixToIso } from "@/lib/date";
import { getDb, inClause } from "./_db";
import { fetchTagsByParentIds, type PostTag } from "./_tags";

export type PublicPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  date: string;
  readingTime: number;
  tags: PostTag[];
};

export type PublicPostDetail = PublicPost & {
  contentMd: string;
};

export async function getPublishedPosts(opts?: {
  tag?: string;
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<{ posts: PublicPost[]; total: number }> {
  const db = await getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const conditions = [eq(posts.status, "published")];
  if (opts?.query) {
    conditions.push(like(posts.title, `%${opts.query}%`));
  }

  // Resolve tag filter to a list of post ids first.
  let tagPostIds: string[] | null = null;
  if (opts?.tag) {
    const tagResult = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(eq(tags.slug, opts.tag));
    tagPostIds = tagResult.map((r) => r.postId);
    if (tagPostIds.length === 0) return { posts: [], total: 0 };
  }

  const where = tagPostIds
    ? and(...conditions, inClause(posts.id, tagPostIds))
    : and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(posts).where(where);

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImageUrl: posts.coverImageUrl,
      contentMd: posts.contentMd,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(where)
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);

  const tagsByPost = await fetchTagsByParentIds(
    db,
    "post",
    rows.map((r) => r.id),
  );

  return {
    posts: rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      coverImageUrl: r.coverImageUrl,
      date: r.publishedAt ? unixToIso(r.publishedAt) : unixToIso(0),
      readingTime: computeReadingTime(r.contentMd),
      tags: tagsByPost.get(r.id) ?? [],
    })),
    total,
  };
}

export type FeedPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  contentMd: string;
  date: string;
};

// Published posts with their full markdown body, newest first — the RSS feed
// renders these to HTML. Separate from getPublishedPosts, which deliberately
// drops content_md to keep the archive payload small.
export async function getFeedPosts(limit: number): Promise<FeedPost[]> {
  const db = await getDb();
  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      contentMd: posts.contentMd,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    contentMd: r.contentMd,
    date: r.publishedAt ? unixToIso(r.publishedAt) : unixToIso(0),
  }));
}

export class PostConflictError extends Error {
  constructor(message = "Slug already exists") {
    super(message);
    this.name = "PostConflictError";
  }
}

export class PostNotFoundError extends Error {
  constructor(id: string) {
    super(`Post ${id} not found`);
    this.name = "PostNotFoundError";
  }
}

type PostMutationInput = {
  title: string;
  slug: string;
  contentMd: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  status?: "draft" | "published";
  tagIds?: string[];
};

export async function createPost(input: PostMutationInput): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const status = input.status ?? "draft";
  const publishedAt = status === "published" ? Math.floor(Date.now() / 1000) : null;

  try {
    await db.insert(posts).values({
      id,
      slug: input.slug,
      title: input.title,
      contentMd: input.contentMd,
      excerpt: input.excerpt ?? null,
      coverImageUrl: input.coverImageUrl || null,
      status,
      publishedAt,
    });

    if (input.tagIds && input.tagIds.length > 0) {
      await db.insert(postTags).values(input.tagIds.map((tagId) => ({ postId: id, tagId })));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new PostConflictError();
    throw err;
  }

  return { id, slug: input.slug };
}

export async function updatePost(
  id: string,
  input: Partial<PostMutationInput>,
): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const [existing] = await db.select().from(posts).where(eq(posts.id, id));
  if (!existing) throw new PostNotFoundError(id);

  const newStatus = input.status ?? existing.status;
  let publishedAt = existing.publishedAt;
  if (newStatus === "published" && existing.status !== "published") {
    publishedAt = Math.floor(Date.now() / 1000);
  }

  try {
    await db
      .update(posts)
      .set({
        title: input.title ?? existing.title,
        slug: input.slug ?? existing.slug,
        contentMd: input.contentMd ?? existing.contentMd,
        excerpt: input.excerpt ?? existing.excerpt,
        coverImageUrl:
          input.coverImageUrl !== undefined ? input.coverImageUrl || null : existing.coverImageUrl,
        status: newStatus,
        publishedAt,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(posts.id, id));

    if (input.tagIds !== undefined) {
      await db.delete(postTags).where(eq(postTags.postId, id));
      if (input.tagIds.length > 0) {
        await db.insert(postTags).values(input.tagIds.map((tagId) => ({ postId: id, tagId })));
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new PostConflictError();
    throw err;
  }

  return { id, slug: input.slug ?? existing.slug };
}

export async function deletePost(id: string): Promise<void> {
  const db = await getDb();
  const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id));
  if (!existing) throw new PostNotFoundError(id);
  await db.delete(posts).where(eq(posts.id, id));
}

export async function getPostBySlug(slug: string): Promise<PublicPostDetail | null> {
  const db = await getDb();
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
  if (!post || post.status !== "published") return null;

  const tagMap = await fetchTagsByParentIds(db, "post", [post.id]);

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    contentMd: post.contentMd,
    date: post.publishedAt ? unixToIso(post.publishedAt) : unixToIso(0),
    readingTime: computeReadingTime(post.contentMd),
    tags: tagMap.get(post.id) ?? [],
  };
}

export type AdminPost = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: number;
};

export type AdminPostDetail = {
  id: string;
  title: string;
  slug: string;
  contentMd: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  status: "draft" | "published";
  tagIds: string[];
};

// Full editable post for the admin edit form: raw fields (any status) plus the
// selected tag ids. Returns null when the id doesn't exist.
export async function getAdminPostById(id: string): Promise<AdminPostDetail | null> {
  const db = await getDb();
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return null;

  const tagRows = await db
    .select({ tagId: postTags.tagId })
    .from(postTags)
    .where(eq(postTags.postId, id));

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    contentMd: post.contentMd,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    status: post.status as "draft" | "published",
    tagIds: tagRows.map((r) => r.tagId),
  };
}

// Every post (all statuses) for the admin list, newest first. The admin table
// searches / sorts / paginates client-side, so it takes the full set.
export async function getAllAdminPosts(): Promise<AdminPost[]> {
  const db = await getDb();
  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      status: posts.status,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .orderBy(desc(posts.updatedAt));
}

export async function getAdminPosts(opts?: {
  q?: string;
  status?: "draft" | "published";
  limit?: number;
  offset?: number;
}): Promise<{ items: AdminPost[]; total: number }> {
  const db = await getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const conditions: SQL[] = [];
  if (opts?.q) conditions.push(like(posts.title, `%${opts.q}%`));
  if (opts?.status) conditions.push(eq(posts.status, opts.status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(posts).where(where);

  const items = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      status: posts.status,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(where)
    .orderBy(desc(posts.updatedAt))
    .limit(limit)
    .offset(offset);

  return { items, total };
}

export async function getTagsWithCounts(): Promise<
  { name: string; slug: string; count: number }[]
> {
  const db = await getDb();
  return db
    .select({ name: tags.name, slug: tags.slug, count: count() })
    .from(tags)
    .innerJoin(postTags, eq(tags.id, postTags.tagId))
    .innerJoin(posts, eq(posts.id, postTags.postId))
    .where(eq(posts.status, "published"))
    .groupBy(tags.id, tags.name, tags.slug)
    .orderBy(desc(count()));
}
