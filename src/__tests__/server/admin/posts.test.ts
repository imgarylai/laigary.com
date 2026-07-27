// @vitest-environment node
//
// Admin post mutations against the real better-sqlite3 harness, like the
// sibling reads.test.ts. Every failure these map is one the public API can
// actually produce — a duplicate slug, an unknown id — so none of them are
// faked; the only mock is the transient driver failure AGENTS.md carves out.
// Driving the real query layer is also what makes the assertions falsifiable:
// asserting the row is gone catches a delete handed the wrong argument, which
// `toHaveBeenCalledWith` on a stub could only restate.

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";
import { seedPost } from "../../factories";

const harness = setupTestDb();

const validPost = { title: "Hello", slug: "hello", contentMd: "body" };

describe("createPostImpl", () => {
  it("writes the post and returns its ref", async () => {
    const { createPostImpl } = await import("@/server/admin/posts");
    const { getAdminPosts } = await import("@/db/queries");

    const res = await createPostImpl(validPost);

    expect(res).toEqual({ ok: true, data: { id: expect.any(String), slug: "hello" } });
    expect((await getAdminPosts()).items.map((p) => p.slug)).toEqual(["hello"]);
  });

  it("maps a duplicate slug to ok:false", async () => {
    await seedPost({ slug: "hello" });
    const { createPostImpl } = await import("@/server/admin/posts");

    expect(await createPostImpl(validPost)).toEqual({ ok: false, error: "Slug already exists" });
  });

  it("lets a driver failure propagate rather than reporting it as a failed action", async () => {
    // The one sanctioned mock: a storage-level failure the public API cannot
    // produce. One call throws, every other test here stays on the real DB.
    vi.spyOn(harness.db, "batch").mockImplementationOnce(() => {
      throw new Error("disk I/O error");
    });
    const { createPostImpl } = await import("@/server/admin/posts");

    await expect(createPostImpl(validPost)).rejects.toThrow("disk I/O error");
  });
});

describe("updatePostImpl", () => {
  it("applies the edit to the row without passing id through as a field", async () => {
    const { id } = await seedPost({ slug: "old", title: "Old", status: "published" });
    const { updatePostImpl } = await import("@/server/admin/posts");
    const { getPostBySlug } = await import("@/db/queries");

    const res = await updatePostImpl({ id, title: "New", slug: "new" });

    expect(res).toEqual({ ok: true, data: { id, slug: "new" } });
    expect((await getPostBySlug("new"))?.title).toBe("New");
  });

  it("maps an unknown id to ok:false", async () => {
    const { updatePostImpl } = await import("@/server/admin/posts");

    expect(await updatePostImpl({ id: "missing" })).toEqual({
      ok: false,
      error: "Post missing not found",
    });
  });

  it("maps a slug already taken by another post to ok:false", async () => {
    await seedPost({ slug: "taken" });
    const { id } = await seedPost({ slug: "mine" });
    const { updatePostImpl } = await import("@/server/admin/posts");

    expect(await updatePostImpl({ id, slug: "taken" })).toEqual({
      ok: false,
      error: "Slug already exists",
    });
  });
});

describe("deletePostImpl", () => {
  it("removes the row and returns ok", async () => {
    const { id } = await seedPost({ slug: "doomed" });
    const { deletePostImpl } = await import("@/server/admin/posts");
    const { getAdminPosts } = await import("@/db/queries");

    expect(await deletePostImpl({ id })).toEqual({ ok: true });
    expect((await getAdminPosts()).items).toEqual([]);
  });

  it("maps an unknown id to ok:false", async () => {
    const { deletePostImpl } = await import("@/server/admin/posts");

    expect(await deletePostImpl({ id: "missing" })).toEqual({
      ok: false,
      error: "Post missing not found",
    });
  });
});

describe("post schemas", () => {
  it("accepts a valid post", async () => {
    const { postCreateSchema } = await import("@/server/admin/posts");
    expect(() => postCreateSchema.parse(validPost)).not.toThrow();
  });

  it("rejects an invalid slug", async () => {
    const { postCreateSchema } = await import("@/server/admin/posts");
    expect(() => postCreateSchema.parse({ ...validPost, slug: "Not A Slug" })).toThrow();
  });

  it("rejects a missing title", async () => {
    const { postCreateSchema } = await import("@/server/admin/posts");
    expect(() => postCreateSchema.parse({ slug: "hello", contentMd: "x" })).toThrow();
  });

  it("update requires an id", async () => {
    const { postUpdateSchema } = await import("@/server/admin/posts");
    expect(() => postUpdateSchema.parse({ title: "Hi" })).toThrow();
  });
});
