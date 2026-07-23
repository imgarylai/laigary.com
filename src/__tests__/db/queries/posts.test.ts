// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { seedTag as seedTagRow } from "../../factories";

setupTestDb();

const seedTag = (name: string, slug: string) => seedTagRow({ name, slug });

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

  it("throws PostNotFoundError for unknown id", async () => {
    const { updatePost, PostNotFoundError } = await import("@/db/queries");
    await expect(
      updatePost("missing", { title: "x", slug: "x", contentMd: "x" }),
    ).rejects.toBeInstanceOf(PostNotFoundError);
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

  it("respects limit and offset", async () => {
    const { createPost, getPublishedPosts } = await import("@/db/queries");
    for (let i = 0; i < 5; i++) {
      await createPost({
        title: `P${i}`,
        slug: `p${i}`,
        contentMd: "x",
        status: "published",
      });
    }
    const page1 = await getPublishedPosts({ limit: 2, offset: 0 });
    const page2 = await getPublishedPosts({ limit: 2, offset: 2 });
    expect(page1.posts).toHaveLength(2);
    expect(page2.posts).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.posts[0].slug).not.toBe(page2.posts[0].slug);
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
