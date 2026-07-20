import { describe, it, expect, vi, beforeEach } from "vitest";
import * as queries from "@/db/queries";
import { TagConflictError, TagNotFoundError } from "@/db/queries";
import { createTagImpl, updateTagImpl, deleteTagImpl, tagCreateSchema } from "@/server/admin/tags";

vi.mock("@/db/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/queries")>();
  return { ...actual, createTag: vi.fn(), updateTag: vi.fn(), deleteTag: vi.fn() };
});

beforeEach(() => vi.clearAllMocks());

describe("createTagImpl", () => {
  it("calls createTag and returns ok", async () => {
    vi.mocked(queries.createTag).mockResolvedValue({ id: "t1", name: "Go", slug: "go" });
    expect(await createTagImpl({ name: "Go", slug: "go" })).toEqual({ ok: true });
    expect(queries.createTag).toHaveBeenCalledWith({ name: "Go", slug: "go" });
  });

  it("maps a conflict to ok:false", async () => {
    vi.mocked(queries.createTag).mockRejectedValue(new TagConflictError("Tag already exists"));
    expect(await createTagImpl({ name: "Go", slug: "go" })).toEqual({
      ok: false,
      error: "Tag already exists",
    });
  });
});

describe("updateTagImpl", () => {
  it("only forwards the name (slug is immutable)", async () => {
    vi.mocked(queries.updateTag).mockResolvedValue({ id: "t1", name: "Golang", slug: "go" });
    expect(await updateTagImpl({ id: "t1", name: "Golang" })).toEqual({ ok: true });
    expect(queries.updateTag).toHaveBeenCalledWith("t1", { name: "Golang" });
  });

  it("maps not-found to ok:false", async () => {
    vi.mocked(queries.updateTag).mockRejectedValue(new TagNotFoundError("t1"));
    expect(await updateTagImpl({ id: "t1", name: "X" })).toEqual({
      ok: false,
      error: "Tag t1 not found",
    });
  });
});

describe("deleteTagImpl", () => {
  it("calls deleteTag and returns ok", async () => {
    vi.mocked(queries.deleteTag).mockResolvedValue(undefined);
    expect(await deleteTagImpl({ id: "t1" })).toEqual({ ok: true });
    expect(queries.deleteTag).toHaveBeenCalledWith("t1");
  });
});

describe("tagCreateSchema", () => {
  it("rejects an empty name", () => {
    expect(() => tagCreateSchema.parse({ name: "", slug: "go" })).toThrow();
  });
  it("rejects a bad slug", () => {
    expect(() => tagCreateSchema.parse({ name: "Go", slug: "Go Lang" })).toThrow();
  });
});
