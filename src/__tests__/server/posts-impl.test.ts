// @vitest-environment node
//
// The published-post search behind the ⌘K palette, against the real
// better-sqlite3 harness. It used to live inline in the createServerFn handler,
// where nothing could reach it — so the two paging defaults were unmeasured, and
// they are the ones that decide how much of the archive a search can see.
import { describe, it, expect } from "vitest";
import { setupTestDb } from "../db/helpers/test-db";
import { seedPost } from "../factories";

setupTestDb();

describe("searchPostsImpl", () => {
  it("matches published posts on the query", async () => {
    await seedPost({ title: "Gas Station", slug: "gas" });
    await seedPost({ title: "Two Sum", slug: "two-sum" });
    const { searchPostsImpl } = await import("@/server/posts");

    const { posts, total } = await searchPostsImpl({ q: "Gas" });

    expect(posts.map((p) => p.slug)).toEqual(["gas"]);
    expect(total).toBe(1);
  });

  it("leaves drafts out of the palette", async () => {
    await seedPost({ title: "Draft Post", slug: "wip", status: "draft" });
    const { searchPostsImpl } = await import("@/server/posts");

    expect((await searchPostsImpl({ q: "Draft" })).posts).toEqual([]);
  });

  it("returns the whole archive when no limit is given", async () => {
    // 21 rows, deliberately past the 20-per-page the admin table uses: a
    // default that silently borrowed that number would truncate here.
    for (let i = 0; i < 21; i++) await seedPost({ title: `Post ${i}`, slug: `p-${i}` });
    const { searchPostsImpl } = await import("@/server/posts");

    expect((await searchPostsImpl({}).then((r) => r.posts)).length).toBe(21);
  });

  it("honours the limit the palette asks for", async () => {
    for (let i = 0; i < 5; i++) await seedPost({ title: `Post ${i}`, slug: `p-${i}` });
    const { searchPostsImpl } = await import("@/server/posts");

    const { posts, total } = await searchPostsImpl({ limit: 2 });

    expect(posts.length).toBe(2);
    // `total` is the match count, not the page size — the palette shows all 5
    // exist even while rendering 2.
    expect(total).toBe(5);
  });

  it("starts at the first row unless an offset is given", async () => {
    for (let i = 0; i < 3; i++) await seedPost({ title: `Post ${i}`, slug: `p-${i}` });
    const { searchPostsImpl } = await import("@/server/posts");

    const first = await searchPostsImpl({ limit: 1 });
    const second = await searchPostsImpl({ limit: 1, offset: 1 });

    expect(first.posts[0].slug).not.toBe(second.posts[0].slug);
  });

  it("filters by tag", async () => {
    const { seedTag } = await import("../factories");
    const tag = await seedTag({ name: "Go", slug: "go" });
    await seedPost({ title: "Tagged", slug: "tagged", tagIds: [tag.id] });
    await seedPost({ title: "Untagged", slug: "untagged" });
    const { searchPostsImpl } = await import("@/server/posts");

    expect((await searchPostsImpl({ tag: "go" })).posts.map((p) => p.slug)).toEqual(["tagged"]);
  });
});
