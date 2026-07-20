import { describe, it, expect, vi, beforeEach } from "vitest";
import * as queries from "@/db/queries";
import { PostConflictError, PostNotFoundError } from "@/db/queries";
import {
  createPostImpl,
  updatePostImpl,
  deletePostImpl,
  postCreateSchema,
  postUpdateSchema,
} from "@/server/admin/posts";

// Keep the real error classes (so toFailure's instanceof mapping works) but
// stub the mutation functions.
vi.mock("@/db/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/queries")>();
  return { ...actual, createPost: vi.fn(), updatePost: vi.fn(), deletePost: vi.fn() };
});

beforeEach(() => vi.clearAllMocks());

const validPost = { title: "Hello", slug: "hello", contentMd: "body" };

describe("createPostImpl", () => {
  it("calls createPost and returns the created ref", async () => {
    vi.mocked(queries.createPost).mockResolvedValue({ id: "p1", slug: "hello" });
    const res = await createPostImpl(validPost);
    expect(queries.createPost).toHaveBeenCalledWith(validPost);
    expect(res).toEqual({ ok: true, data: { id: "p1", slug: "hello" } });
  });

  it("maps a slug conflict to ok:false", async () => {
    vi.mocked(queries.createPost).mockRejectedValue(new PostConflictError("Slug already exists"));
    expect(await createPostImpl(validPost)).toEqual({ ok: false, error: "Slug already exists" });
  });

  it("rethrows unexpected errors", async () => {
    vi.mocked(queries.createPost).mockRejectedValue(new Error("boom"));
    await expect(createPostImpl(validPost)).rejects.toThrow("boom");
  });
});

describe("updatePostImpl", () => {
  it("splits id from the payload and calls updatePost", async () => {
    vi.mocked(queries.updatePost).mockResolvedValue({ id: "p1", slug: "hi" });
    const res = await updatePostImpl({ id: "p1", title: "Hi", slug: "hi" });
    expect(queries.updatePost).toHaveBeenCalledWith("p1", { title: "Hi", slug: "hi" });
    expect(res).toEqual({ ok: true, data: { id: "p1", slug: "hi" } });
  });

  it("maps not-found to ok:false", async () => {
    vi.mocked(queries.updatePost).mockRejectedValue(new PostNotFoundError("p1"));
    expect(await updatePostImpl({ id: "p1" })).toEqual({ ok: false, error: "Post p1 not found" });
  });
});

describe("deletePostImpl", () => {
  it("calls deletePost and returns ok", async () => {
    vi.mocked(queries.deletePost).mockResolvedValue(undefined);
    expect(await deletePostImpl({ id: "p1" })).toEqual({ ok: true });
    expect(queries.deletePost).toHaveBeenCalledWith("p1");
  });

  it("maps not-found to ok:false", async () => {
    vi.mocked(queries.deletePost).mockRejectedValue(new PostNotFoundError("p1"));
    expect(await deletePostImpl({ id: "p1" })).toEqual({ ok: false, error: "Post p1 not found" });
  });
});

describe("post schemas", () => {
  it("accepts a valid post", () => {
    expect(() => postCreateSchema.parse(validPost)).not.toThrow();
  });

  it("rejects an invalid slug", () => {
    expect(() => postCreateSchema.parse({ ...validPost, slug: "Not A Slug" })).toThrow();
  });

  it("rejects a missing title", () => {
    expect(() => postCreateSchema.parse({ slug: "hello", contentMd: "x" })).toThrow();
  });

  it("update requires an id", () => {
    expect(() => postUpdateSchema.parse({ title: "Hi" })).toThrow();
  });
});
