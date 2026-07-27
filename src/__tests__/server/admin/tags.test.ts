// @vitest-environment node
//
// Admin tag mutations against the real better-sqlite3 harness. deleteTagImpl
// was the one delete impl with no not-found test, so its catch could return
// ok:true — a failed delete reporting success — and stay green.

import { describe, it, expect } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";
import { seedTag } from "../../factories";

setupTestDb();

describe("createTagImpl", () => {
  it("writes the tag and returns ok", async () => {
    const { createTagImpl } = await import("@/server/admin/tags");
    const { getAllTags } = await import("@/db/queries");

    expect(await createTagImpl({ name: "Go", slug: "go" })).toEqual({ ok: true });
    expect((await getAllTags()).map((t) => t.slug)).toEqual(["go"]);
  });

  it("maps a duplicate slug to ok:false", async () => {
    await seedTag({ name: "Go", slug: "go" });
    const { createTagImpl } = await import("@/server/admin/tags");

    expect(await createTagImpl({ name: "Golang", slug: "go" })).toEqual({
      ok: false,
      error: "Tag already exists",
    });
  });
});

describe("updateTagImpl", () => {
  it("renames the tag and leaves its slug alone", async () => {
    const { id, slug } = await seedTag({ name: "Go", slug: "go" });
    const { updateTagImpl } = await import("@/server/admin/tags");
    const { getAllTags } = await import("@/db/queries");

    expect(await updateTagImpl({ id, name: "Golang" })).toEqual({ ok: true });
    expect(await getAllTags()).toEqual([{ id, name: "Golang", slug }]);
  });

  it("maps an unknown id to ok:false", async () => {
    const { updateTagImpl } = await import("@/server/admin/tags");

    expect(await updateTagImpl({ id: "missing", name: "X" })).toEqual({
      ok: false,
      error: "Tag missing not found",
    });
  });

  it("maps a name already taken by another tag to ok:false", async () => {
    await seedTag({ name: "Go", slug: "go" });
    const { id } = await seedTag({ name: "Rust", slug: "rust" });
    const { updateTagImpl } = await import("@/server/admin/tags");

    expect(await updateTagImpl({ id, name: "Go" })).toEqual({
      ok: false,
      error: "Tag name already exists",
    });
  });
});

describe("deleteTagImpl", () => {
  it("removes the row and returns ok", async () => {
    const { id } = await seedTag({ name: "Go", slug: "go" });
    const { deleteTagImpl } = await import("@/server/admin/tags");
    const { getAllTags } = await import("@/db/queries");

    expect(await deleteTagImpl({ id })).toEqual({ ok: true });
    expect(await getAllTags()).toEqual([]);
  });

  it("maps an unknown id to ok:false", async () => {
    const { deleteTagImpl } = await import("@/server/admin/tags");

    expect(await deleteTagImpl({ id: "missing" })).toEqual({
      ok: false,
      error: "Tag missing not found",
    });
  });
});

describe("tagCreateSchema", () => {
  it("rejects an empty name", async () => {
    const { tagCreateSchema } = await import("@/server/admin/tags");
    expect(() => tagCreateSchema.parse({ name: "", slug: "go" })).toThrow();
  });

  it("rejects a bad slug", async () => {
    const { tagCreateSchema } = await import("@/server/admin/tags");
    expect(() => tagCreateSchema.parse({ name: "Go", slug: "Go Lang" })).toThrow();
  });
});
