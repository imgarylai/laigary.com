// @vitest-environment node

import { describe, it, expect } from "vitest";
import { setupTestDb } from "../helpers/test-db";

setupTestDb();

describe("tags queries", () => {
  it("createTag inserts a new row", async () => {
    const { createTag } = await import("@/db/queries");
    const tag = await createTag({ name: "Life", slug: "life" });

    expect(tag.id).toBeTruthy();
    expect(tag.name).toBe("Life");
    expect(tag.slug).toBe("life");
  });

  it("createTag throws TagConflictError on duplicate slug", async () => {
    const { createTag, TagConflictError } = await import("@/db/queries");
    await createTag({ name: "Life", slug: "life" });

    await expect(createTag({ name: "Life Two", slug: "life" })).rejects.toBeInstanceOf(
      TagConflictError,
    );
  });

  it("updateTag changes the name", async () => {
    const { createTag, updateTag, getTagsWithUsage } = await import("@/db/queries");
    const created = await createTag({ name: "Old", slug: "old" });

    await updateTag(created.id, { name: "New" });
    const all = await getTagsWithUsage();
    expect(all.find((t) => t.id === created.id)?.name).toBe("New");
  });

  it("updateTag throws TagNotFoundError for unknown id", async () => {
    const { updateTag, TagNotFoundError } = await import("@/db/queries");
    await expect(updateTag("does-not-exist", { name: "x" })).rejects.toBeInstanceOf(
      TagNotFoundError,
    );
  });

  it("deleteTag removes the row", async () => {
    const { createTag, deleteTag, getTagsWithUsage } = await import("@/db/queries");
    const created = await createTag({ name: "Tmp", slug: "tmp" });

    await deleteTag(created.id);
    const all = await getTagsWithUsage();
    expect(all).toHaveLength(0);
  });

  it("deleteTag throws TagNotFoundError for unknown id", async () => {
    const { deleteTag, TagNotFoundError } = await import("@/db/queries");
    await expect(deleteTag("does-not-exist")).rejects.toBeInstanceOf(TagNotFoundError);
  });
});

describe("getAllTags", () => {
  it("returns id/name/slug for every tag, sorted by name", async () => {
    const { createTag, getAllTags } = await import("@/db/queries");
    await createTag({ name: "Zeta", slug: "zeta" });
    await createTag({ name: "Alpha", slug: "alpha" });

    const all = await getAllTags();
    expect(all.map((t) => t.name)).toEqual(["Alpha", "Zeta"]);
    expect(all[0]).toEqual({ id: expect.any(String), name: "Alpha", slug: "alpha" });
  });
});
