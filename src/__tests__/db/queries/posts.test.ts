// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { seedTag as seedTagRow } from "../../factories";

setupTestDb();

const seedTag = (name: string, slug: string) => seedTagRow({ name, slug });

/**
 * Publish posts on distinct, ascending seconds — listed oldest first.
 *
 * `createPost` stamps `publishedAt` from `Date.now()`, so rows seeded in a
 * tight loop all land on the same second and any ordering assertion over them
 * is unobservable rather than merely unasserted. Spy the clock so chronology
 * is a property the query can actually get wrong.
 */
async function seedChronology(slugs: string[]) {
  const { createPost } = await import("@/db/queries");
  const now = vi.spyOn(Date, "now");
  for (const [i, slug] of slugs.entries()) {
    now.mockReturnValue((i + 1) * 1_000_000);
    await createPost({ title: slug, slug, contentMd: "x", status: "published" });
  }
  now.mockRestore();
}

describe("createPost", () => {
  it("inserts a draft by default with no publishedAt", async () => {
    const { createPost, getAdminPosts } = await import("@/db/queries");
    const { id, slug } = await createPost({
      title: "Hello",
      slug: "hello",
      contentMd: "body",
    });
    expect(id).toBeTruthy();
    expect(slug).toBe("hello");

    const { items } = await getAdminPosts();
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe("draft");
  });

  it("sets publishedAt when status is published", async () => {
    const { createPost, getPublishedPosts } = await import("@/db/queries");
    await createPost({
      title: "Live",
      slug: "live",
      contentMd: "body",
      status: "published",
    });
    const { posts, total } = await getPublishedPosts();
    expect(total).toBe(1);
    expect(posts[0].slug).toBe("live");
  });

  it("links tags via post_tags", async () => {
    const { createPost, getPostBySlug } = await import("@/db/queries");
    const tag = await seedTag("Life", "life");
    await createPost({
      title: "Tagged",
      slug: "tagged",
      contentMd: "body",
      status: "published",
      tagIds: [tag.id],
    });
    const post = await getPostBySlug("tagged");
    expect(post?.tags.map((t) => t.slug)).toEqual(["life"]);
  });

  it("throws PostConflictError on duplicate slug", async () => {
    const { createPost, PostConflictError } = await import("@/db/queries");
    await createPost({ title: "A", slug: "dup", contentMd: "x" });
    await expect(createPost({ title: "B", slug: "dup", contentMd: "y" })).rejects.toBeInstanceOf(
      PostConflictError,
    );
  });

  it("leaves no orphan row behind when the tag write fails", async () => {
    // Without atomicity the post row is already committed by the time the tag
    // insert fails, so a reported failure still leaves an untagged post.
    const { createPost, getAdminPosts } = await import("@/db/queries");

    await expect(
      createPost({ title: "X", slug: "x", contentMd: "b", tagIds: ["does-not-exist"] }),
    ).rejects.toThrow();

    const { total } = await getAdminPosts();
    expect(total).toBe(0);
  });
});

describe("updatePost", () => {
  it("updates title and content while preserving other fields", async () => {
    const { createPost, updatePost, getAdminPosts } = await import("@/db/queries");
    const { id } = await createPost({ title: "Old", slug: "post", contentMd: "old" });
    await updatePost(id, { title: "New", slug: "post", contentMd: "new" });
    const { items } = await getAdminPosts();
    expect(items[0].title).toBe("New");
  });

  it("sets publishedAt when transitioning draft → published", async () => {
    const { createPost, updatePost, getPublishedPosts } = await import("@/db/queries");
    const { id } = await createPost({ title: "Draft", slug: "draft", contentMd: "x" });
    await updatePost(id, {
      title: "Draft",
      slug: "draft",
      contentMd: "x",
      status: "published",
    });
    const { total } = await getPublishedPosts();
    expect(total).toBe(1);
  });

  it("replaces tag links when tagIds is provided", async () => {
    const { createPost, updatePost, getPostBySlug } = await import("@/db/queries");
    const tagA = await seedTag("A", "a");
    const tagB = await seedTag("B", "b");
    const { id } = await createPost({
      title: "T",
      slug: "t",
      contentMd: "x",
      status: "published",
      tagIds: [tagA.id],
    });

    await updatePost(id, { title: "T", slug: "t", contentMd: "x", tagIds: [tagB.id] });

    const post = await getPostBySlug("t");
    expect(post?.tags.map((t) => t.slug)).toEqual(["b"]);
  });

  it("clears every tag when tagIds is empty", async () => {
    // An empty array deletes without inserting — distinct from omitting tagIds,
    // which leaves the existing links alone.
    const { createPost, updatePost, getPostBySlug } = await import("@/db/queries");
    const tagA = await seedTag("A", "a");
    const { id } = await createPost({
      title: "T",
      slug: "t",
      contentMd: "x",
      status: "published",
      tagIds: [tagA.id],
    });

    await updatePost(id, { title: "T", slug: "t", contentMd: "x", tagIds: [] });

    const post = await getPostBySlug("t");
    expect(post?.tags).toEqual([]);
  });

  it("throws PostNotFoundError for unknown id", async () => {
    const { updatePost, PostNotFoundError } = await import("@/db/queries");
    await expect(
      updatePost("missing", { title: "x", slug: "x", contentMd: "x" }),
    ).rejects.toBeInstanceOf(PostNotFoundError);
  });

  it("leaves the row and its tags untouched when the tag write fails", async () => {
    // The row update, the tag delete and the tag insert are one unit. A tagId
    // that does not exist fails the insert, and without atomicity the caller
    // sees an error while the post has already been renamed and stripped of
    // every tag — the original set unrecoverable.
    const { createPost, updatePost, getPostBySlug } = await import("@/db/queries");
    const tag = await seedTag("Go", "go");
    const { id } = await createPost({
      title: "Original",
      slug: "original",
      contentMd: "body",
      status: "published",
      tagIds: [tag.id],
    });

    await expect(
      updatePost(id, { title: "Renamed", tagIds: ["does-not-exist"] }),
    ).rejects.toThrow();

    const after = await getPostBySlug("original");
    expect(after?.title).toBe("Original");
    expect(after?.tags.map((t) => t.slug)).toEqual(["go"]);
  });
});

describe("deletePost", () => {
  it("removes the post", async () => {
    const { createPost, deletePost, getAdminPosts } = await import("@/db/queries");
    const { id } = await createPost({ title: "x", slug: "x", contentMd: "x" });
    await deletePost(id);
    const { total } = await getAdminPosts();
    expect(total).toBe(0);
  });

  it("throws PostNotFoundError for unknown id", async () => {
    const { deletePost, PostNotFoundError } = await import("@/db/queries");
    await expect(deletePost("missing")).rejects.toBeInstanceOf(PostNotFoundError);
  });
});

describe("getPublishedPosts", () => {
  it("filters by tag slug", async () => {
    const { createPost, getPublishedPosts } = await import("@/db/queries");
    const a = await seedTag("A", "a");
    const b = await seedTag("B", "b");
    await createPost({
      title: "P1",
      slug: "p1",
      contentMd: "x",
      status: "published",
      tagIds: [a.id],
    });
    await createPost({
      title: "P2",
      slug: "p2",
      contentMd: "x",
      status: "published",
      tagIds: [b.id],
    });

    const onlyA = await getPublishedPosts({ tag: "a" });
    expect(onlyA.posts).toHaveLength(1);
    expect(onlyA.posts[0].slug).toBe("p1");
  });

  it("lists newest first", async () => {
    // Seeded oldest → newest, so a feed that has kept its ordering hands them
    // back reversed. This is the invariant the home page's "latest post" probe
    // and every /tags/$slug page depend on.
    const { getPublishedPosts } = await import("@/db/queries");
    await seedChronology(["oldest", "middle", "newest"]);

    const { posts } = await getPublishedPosts();
    expect(posts.map((p) => p.slug)).toEqual(["newest", "middle", "oldest"]);
  });

  it("respects limit and offset", async () => {
    const { getPublishedPosts } = await import("@/db/queries");
    await seedChronology(["p0", "p1", "p2", "p3", "p4"]);

    const page1 = await getPublishedPosts({ limit: 2, offset: 0 });
    const page2 = await getPublishedPosts({ limit: 2, offset: 2 });
    // Exact slices, not just "the two pages differ" — that much stays true
    // even if offset is ignored and the rows come back in insertion order.
    expect(page1.posts.map((p) => p.slug)).toEqual(["p4", "p3"]);
    expect(page2.posts.map((p) => p.slug)).toEqual(["p2", "p1"]);
    expect(page1.total).toBe(5);
  });

  it("returns empty for unknown tag", async () => {
    const { getPublishedPosts } = await import("@/db/queries");
    const result = await getPublishedPosts({ tag: "nope" });
    expect(result).toEqual({ posts: [], total: 0 });
  });

  it("hides drafts", async () => {
    const { createPost, getPublishedPosts } = await import("@/db/queries");
    await createPost({ title: "Draft", slug: "draft", contentMd: "x" });
    const result = await getPublishedPosts();
    expect(result.total).toBe(0);
  });
});

describe("pinned posts", () => {
  it("defaults pinned to false and round-trips a pinned create", async () => {
    const { createPost, getPublishedPosts } = await import("@/db/queries");
    await createPost({ title: "Plain", slug: "plain", contentMd: "x", status: "published" });
    await createPost({
      title: "Pin",
      slug: "pin",
      contentMd: "x",
      status: "published",
      pinned: true,
    });
    const { posts } = await getPublishedPosts();
    expect(posts.find((p) => p.slug === "plain")?.pinned).toBe(false);
    expect(posts.find((p) => p.slug === "pin")?.pinned).toBe(true);
  });

  it("toggles pinned on update", async () => {
    const { createPost, updatePost, getAdminPostById } = await import("@/db/queries");
    const { id } = await createPost({ title: "P", slug: "p", contentMd: "x", pinned: true });
    await updatePost(id, { pinned: false });
    expect((await getAdminPostById(id))?.pinned).toBe(false);
    await updatePost(id, { pinned: true });
    expect((await getAdminPostById(id))?.pinned).toBe(true);
  });

  it("leaves pinned unchanged when the update omits it", async () => {
    const { createPost, updatePost, getAdminPostById } = await import("@/db/queries");
    const { id } = await createPost({ title: "P", slug: "p", contentMd: "x", pinned: true });
    // An edit that doesn't touch the pin control must preserve the flag.
    await updatePost(id, { title: "Renamed" });
    expect((await getAdminPostById(id))?.pinned).toBe(true);
  });

  it("surfaces pinned in the admin list", async () => {
    const { createPost, getAllAdminPosts } = await import("@/db/queries");
    await createPost({ title: "Pin", slug: "pin", contentMd: "x", pinned: true });
    await createPost({ title: "Plain", slug: "plain", contentMd: "x" });
    const rows = await getAllAdminPosts();
    expect(rows.find((p) => p.slug === "pin")?.pinned).toBe(true);
    expect(rows.find((p) => p.slug === "plain")?.pinned).toBe(false);
  });
});

describe("getAdjacentPosts", () => {
  // createPost stamps publishedAt from Date.now(); spy it to give each seed a
  // distinct publish second so chronology is deterministic.
  async function seedTimeline() {
    const { createPost } = await import("@/db/queries");
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000_000_000);
    await createPost({ title: "Oldest", slug: "a", contentMd: "x", status: "published" });
    now.mockReturnValue(2_000_000_000);
    await createPost({ title: "Middle", slug: "b", contentMd: "x", status: "published" });
    now.mockReturnValue(3_000_000_000);
    await createPost({ title: "Newest", slug: "c", contentMd: "x", status: "published" });
    now.mockRestore();
  }

  it("should return both chronological neighbors when the post is in the middle", async () => {
    const { getAdjacentPosts } = await import("@/db/queries");
    await seedTimeline();
    const adj = await getAdjacentPosts("b");
    expect(adj.prev).toEqual({ slug: "a", title: "Oldest" });
    expect(adj.next).toEqual({ slug: "c", title: "Newest" });
  });

  it("should return null on the open side when the post is first or last", async () => {
    const { getAdjacentPosts } = await import("@/db/queries");
    await seedTimeline();
    expect(await getAdjacentPosts("a")).toEqual({
      prev: null,
      next: { slug: "b", title: "Middle" },
    });
    expect(await getAdjacentPosts("c")).toEqual({
      prev: { slug: "b", title: "Middle" },
      next: null,
    });
  });

  it("should return null neighbors when the slug is a draft or unknown", async () => {
    const { createPost, getAdjacentPosts } = await import("@/db/queries");
    await createPost({ title: "Draft", slug: "draft", contentMd: "x" });
    expect(await getAdjacentPosts("draft")).toEqual({ prev: null, next: null });
    expect(await getAdjacentPosts("nope")).toEqual({ prev: null, next: null });
  });
});

describe("getFeedPosts", () => {
  it("should return published posts with their markdown body when called", async () => {
    const { createPost, getFeedPosts } = await import("@/db/queries");
    await createPost({ title: "Live", slug: "live", contentMd: "# body", status: "published" });
    await createPost({ title: "Draft", slug: "draft", contentMd: "hidden" });

    const feed = await getFeedPosts(10);
    expect(feed).toHaveLength(1);
    expect(feed[0].slug).toBe("live");
    expect(feed[0].contentMd).toBe("# body");
    expect(feed[0].date).toBeTruthy();
  });

  it("should cap the result at the limit when more posts exist", async () => {
    const { createPost, getFeedPosts } = await import("@/db/queries");
    for (let i = 0; i < 3; i++) {
      await createPost({ title: `P${i}`, slug: `p${i}`, contentMd: "x", status: "published" });
    }
    expect(await getFeedPosts(2)).toHaveLength(2);
  });
});

describe("getAdminPosts", () => {
  it("filters by q (title substring)", async () => {
    const { createPost, getAdminPosts } = await import("@/db/queries");
    await createPost({ title: "Hello world", slug: "hw", contentMd: "x" });
    await createPost({ title: "Goodbye", slug: "gb", contentMd: "x" });
    const r = await getAdminPosts({ q: "hello" });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].slug).toBe("hw");
  });

  it("filters by status", async () => {
    const { createPost, getAdminPosts } = await import("@/db/queries");
    await createPost({ title: "D", slug: "d", contentMd: "x" });
    await createPost({ title: "P", slug: "p", contentMd: "x", status: "published" });
    const drafts = await getAdminPosts({ status: "draft" });
    expect(drafts.items).toHaveLength(1);
    expect(drafts.items[0].slug).toBe("d");
  });
});

describe("getAdminPostById", () => {
  it("returns editable fields + tagIds for a post", async () => {
    const { createPost, getAdminPostById } = await import("@/db/queries");
    const tag = await seedTag("Go", "go");
    const { id } = await createPost({
      title: "T",
      slug: "t",
      contentMd: "body",
      excerpt: "e",
      status: "published",
      tagIds: [tag.id],
    });

    const post = await getAdminPostById(id);
    expect(post).toMatchObject({
      id,
      title: "T",
      slug: "t",
      contentMd: "body",
      excerpt: "e",
      status: "published",
    });
    expect(post?.tagIds).toEqual([tag.id]);
  });

  it("returns null for a missing id", async () => {
    const { getAdminPostById } = await import("@/db/queries");
    expect(await getAdminPostById("nope")).toBeNull();
  });
});

describe("post branch gaps", () => {
  it("getPublishedPosts filters by title query", async () => {
    const { createPost, getPublishedPosts } = await import("@/db/queries");
    await createPost({ title: "Gas Station", slug: "gas", contentMd: "x", status: "published" });
    await createPost({ title: "Two Sum", slug: "two", contentMd: "x", status: "published" });

    const { posts, total } = await getPublishedPosts({ query: "Gas" });
    expect(posts.map((p) => p.slug)).toEqual(["gas"]);
    expect(total).toBe(1);
  });

  it("createPost rethrows non-UNIQUE errors untouched", async () => {
    const { createPost, PostConflictError } = await import("@/db/queries");
    const err = await createPost({
      title: undefined as never,
      slug: "x",
      contentMd: "x",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(PostConflictError);
  });

  it("updatePost throws PostConflictError when the new slug is taken", async () => {
    const { createPost, updatePost, PostConflictError } = await import("@/db/queries");
    await createPost({ title: "A", slug: "taken", contentMd: "x" });
    const { id } = await createPost({ title: "B", slug: "free", contentMd: "x" });
    await expect(updatePost(id, { slug: "taken" })).rejects.toBeInstanceOf(PostConflictError);
  });
});

// The publish date is the author's to set, and a future one is a schedule: the
// row exists, is flagged published, and still must not reach a reader until its
// second arrives. Every public read has to agree on that or the post leaks
// through whichever one forgot.
describe("scheduled posts", () => {
  const HOUR = 3600;

  /** A published post dated `offset` seconds from now. */
  async function seedAt(slug: string, offset: number) {
    const { createPost } = await import("@/db/queries");
    return createPost({
      title: slug,
      slug,
      contentMd: "body",
      status: "published",
      publishedAt: Math.floor(Date.now() / 1000) + offset,
    });
  }

  it("should keep a future-dated post out of the archive while showing a past-dated one", async () => {
    const { getPublishedPosts } = await import("@/db/queries");
    await seedAt("live", -HOUR);
    await seedAt("tomorrow", HOUR);

    const { posts, total } = await getPublishedPosts();
    expect(posts.map((p) => p.slug)).toEqual(["live"]);
    // The count drives the pager, so a scheduled post inflating it would leave
    // a page-2 link to an empty page.
    expect(total).toBe(1);
  });

  it("should 404 a scheduled post's own URL rather than only hiding it from lists", async () => {
    const { getPostBySlug } = await import("@/db/queries");
    await seedAt("tomorrow", HOUR);
    expect(await getPostBySlug("tomorrow")).toBeNull();
  });

  it("should serve a scheduled post once its date has passed", async () => {
    const { getPostBySlug } = await import("@/db/queries");
    // Dated a second out, then the clock is moved past it — nothing is written
    // in between, which is the whole point: the row was already correct.
    const at = Math.floor(Date.now() / 1000) + 1;
    const { createPost } = await import("@/db/queries");
    await createPost({
      title: "Soon",
      slug: "soon",
      contentMd: "body",
      status: "published",
      publishedAt: at,
    });
    expect(await getPostBySlug("soon")).toBeNull();

    const now = vi.spyOn(Date, "now").mockReturnValue((at + 1) * 1000);
    expect(await getPostBySlug("soon")).not.toBeNull();
    now.mockRestore();
  });

  it("should leave a scheduled post out of the RSS feed", async () => {
    const { getFeedPosts } = await import("@/db/queries");
    await seedAt("live", -HOUR);
    await seedAt("tomorrow", HOUR);
    expect((await getFeedPosts(10)).map((p) => p.slug)).toEqual(["live"]);
  });

  it("should not link a scheduled post as the next one in the timeline", async () => {
    const { getAdjacentPosts } = await import("@/db/queries");
    await seedAt("older", -2 * HOUR);
    await seedAt("current", -HOUR);
    await seedAt("tomorrow", HOUR);

    const { prev, next } = await getAdjacentPosts("current");
    expect(prev?.slug).toBe("older");
    // `next` walks forward in time, so it is the one direction a schedule can
    // leak through — the pager would offer a link to a 404.
    expect(next).toBeNull();
  });

  it("should not count a scheduled post against its tags", async () => {
    const { createPost, getTagsWithCounts } = await import("@/db/queries");
    const { clearQueryCache } = await import("@/db/queries/_cache");
    const tag = await seedTag("Go", "go");
    const now = Math.floor(Date.now() / 1000);
    await createPost({
      title: "Live",
      slug: "live",
      contentMd: "x",
      status: "published",
      publishedAt: now - HOUR,
      tagIds: [tag.id],
    });
    await createPost({
      title: "Tomorrow",
      slug: "tomorrow",
      contentMd: "x",
      status: "published",
      publishedAt: now + HOUR,
      tagIds: [tag.id],
    });

    clearQueryCache();
    expect((await getTagsWithCounts()).find((t) => t.slug === "go")?.count).toBe(1);
  });
});

describe("publish date on write", () => {
  it("should store the date the author picked instead of the moment they saved", async () => {
    const { createPost, getAdminPostById } = await import("@/db/queries");
    const backdated = 1_600_000_000;
    const { id } = await createPost({
      title: "Backdated",
      slug: "backdated",
      contentMd: "x",
      status: "published",
      publishedAt: backdated,
    });
    expect((await getAdminPostById(id))?.publishedAt).toBe(backdated);
  });

  it("should keep a date picked on a draft so publishing later does not overwrite it", async () => {
    // Setting up a schedule takes one save, not two: the date has to survive
    // being stored on a row that is still a draft.
    const { createPost, updatePost, getAdminPostById } = await import("@/db/queries");
    const chosen = 2_000_000_000;
    const { id } = await createPost({
      title: "Planned",
      slug: "planned",
      contentMd: "x",
      status: "draft",
      publishedAt: chosen,
    });
    expect((await getAdminPostById(id))?.publishedAt).toBe(chosen);

    await updatePost(id, { status: "published" });
    expect((await getAdminPostById(id))?.publishedAt).toBe(chosen);
  });

  it("should leave the stored date alone when an edit does not mention it", async () => {
    const { createPost, updatePost, getAdminPostById } = await import("@/db/queries");
    const chosen = 1_500_000_000;
    const { id } = await createPost({
      title: "T",
      slug: "t",
      contentMd: "x",
      status: "published",
      publishedAt: chosen,
    });
    await updatePost(id, { title: "Retitled" });
    expect((await getAdminPostById(id))?.publishedAt).toBe(chosen);
  });

  it("should re-stamp with now when the author clears the date on a published post", async () => {
    const { createPost, updatePost, getAdminPostById } = await import("@/db/queries");
    const { id } = await createPost({
      title: "T",
      slug: "t",
      contentMd: "x",
      status: "published",
      publishedAt: 1_500_000_000,
    });
    // null means "back to automatic", which for a published post is now — not
    // NULL, which would drop it off the site entirely.
    await updatePost(id, { publishedAt: null });
    const stored = (await getAdminPostById(id))?.publishedAt;
    expect(stored).not.toBe(1_500_000_000);
    expect(stored).toBeGreaterThan(1_500_000_000);
  });
});

describe("admin list ordering", () => {
  it("should order by publish date, not by the last edit", async () => {
    // The fixture violates the property: the OLDER post is the one edited most
    // recently, so an `updatedAt` ordering puts it first and a publish ordering
    // does not. Seeded in the same order for both, so neither can pass by
    // accident of insertion.
    const { createPost, updatePost, getAllAdminPosts } = await import("@/db/queries");
    const now = Math.floor(Date.now() / 1000);
    const old = await createPost({
      title: "Old",
      slug: "old",
      contentMd: "x",
      status: "published",
      publishedAt: now - 90_000,
    });
    await createPost({
      title: "Recent",
      slug: "recent",
      contentMd: "x",
      status: "published",
      publishedAt: now - 100,
    });
    await updatePost(old.id, { title: "Old, retouched" });

    expect((await getAllAdminPosts()).map((p) => p.slug)).toEqual(["recent", "old"]);
  });

  it("should sink undated drafts below the dated posts rather than floating them to the top", async () => {
    // SQLite sorts NULL first on a DESC ordering, so the naive version puts
    // every draft above the whole archive.
    const { createPost, getAllAdminPosts } = await import("@/db/queries");
    await createPost({ title: "Draft", slug: "draft", contentMd: "x" });
    await createPost({
      title: "Live",
      slug: "live",
      contentMd: "x",
      status: "published",
      publishedAt: 1_000_000,
    });

    expect((await getAllAdminPosts()).map((p) => p.slug)).toEqual(["live", "draft"]);
  });
});
