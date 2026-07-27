// @vitest-environment node
//
// Page upsert against the real better-sqlite3 harness — both halves of the
// upsert, which a stubbed upsertPage could not tell apart.

import { describe, it, expect } from "vitest";
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
