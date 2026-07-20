// @vitest-environment node

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { createTestDb } from "../helpers/test-db";

const harness = createTestDb();

vi.mock("@opennextjs/cloudflare", () => ({
  // _db.ts only uses env.DB to construct drizzle. Returning a stub keeps
  // getDb() callable; the line below replaces drizzle so the stub is unused.
  getCloudflareContext: vi.fn(async () => ({ env: { DB: {} } })),
}));

vi.mock("drizzle-orm/d1", () => ({
  drizzle: () => harness.db,
}));

beforeAll(() => {
  // Just to anchor harness lifetime to this file.
});

beforeEach(() => {
  harness.truncateAll();
});

afterAll(() => {
  harness.close();
});

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
