// @vitest-environment node
//
// Page upsert against the real better-sqlite3 harness — both halves of the
// upsert, which a stubbed upsertPage could not tell apart.

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";
import { seedPage } from "../../factories";

setupTestDb();

describe("upsertPageImpl", () => {
  it("inserts a page that does not exist yet", async () => {
    const { upsertPageImpl } = await import("@/server/admin/pages");
    const { getPageBySlug } = await import("@/db/queries");

    expect(await upsertPageImpl({ slug: "about", title: "About", contentMd: "hi" })).toEqual({
      ok: true,
    });
    const page = await getPageBySlug("about");
    expect(page).toMatchObject({ slug: "about", title: "About", contentMd: "hi" });
  });

  it("updates the existing row rather than adding a second one", async () => {
    await seedPage({ slug: "about", title: "Old", contentMd: "old" });
    const { upsertPageImpl } = await import("@/server/admin/pages");
    const { getPageBySlug, getAllPages } = await import("@/db/queries");

    expect(await upsertPageImpl({ slug: "about", title: "New", contentMd: "new" })).toEqual({
      ok: true,
    });
    expect((await getAllPages()).length).toBe(1);
    expect(await getPageBySlug("about")).toMatchObject({ title: "New", contentMd: "new" });
  });

  it("keeps the stored values when only the slug is sent", async () => {
    await seedPage({ slug: "now", title: "Now", contentMd: "body" });
    const { upsertPageImpl } = await import("@/server/admin/pages");
    const { getPageBySlug } = await import("@/db/queries");

    expect(await upsertPageImpl({ slug: "now" })).toEqual({ ok: true });
    expect(await getPageBySlug("now")).toMatchObject({ title: "Now", contentMd: "body" });
  });
});

describe("pageUpsertSchema", () => {
  it("requires a slug", async () => {
    const { pageUpsertSchema } = await import("@/server/admin/pages");
    expect(() => pageUpsertSchema.parse({ title: "About" })).toThrow();
  });
});

describe("deletePageImpl", () => {
  it("should delete the page and report success", async () => {
    await seedPage({ slug: "about", title: "About", contentMd: "hi" });
    const { deletePageImpl } = await import("@/server/admin/pages");
    const { getPageBySlug } = await import("@/db/queries");

    expect(await deletePageImpl({ slug: "about" })).toEqual({ ok: true });
    expect(await getPageBySlug("about")).toBeNull();
  });

  it("should report a missing page as a failed result rather than throwing", async () => {
    // PageNotFoundError is an expected error: the row may already be gone from
    // another tab. A throw here would surface as a 500 instead of a toast.
    const { deletePageImpl } = await import("@/server/admin/pages");

    const result = await deletePageImpl({ slug: "missing" });
    expect(result.ok).toBe(false);
  });

  it("should re-throw an unexpected error", async () => {
    const { deletePageImpl } = await import("@/server/admin/pages");
    const queries = await import("@/db/queries");
    const spy = vi.spyOn(queries, "deletePage").mockRejectedValueOnce(new Error("d1 exploded"));

    await expect(deletePageImpl({ slug: "about" })).rejects.toThrow("d1 exploded");
    spy.mockRestore();
  });
});

describe("pageSlugSchema", () => {
  it("should require a non-empty slug", async () => {
    const { pageSlugSchema } = await import("@/server/admin/pages");
    expect(() => pageSlugSchema.parse({ slug: "" })).toThrow();
    expect(pageSlugSchema.parse({ slug: "about" })).toEqual({ slug: "about" });
  });
});
