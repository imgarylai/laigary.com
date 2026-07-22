// @vitest-environment node

import { describe, it, expect } from "vitest";
import { setupTestDb } from "../helpers/test-db";

setupTestDb();

describe("upsertPage", () => {
  it("inserts when slug doesn't exist", async () => {
    const { upsertPage, getPageBySlug } = await import("@/db/queries");
    await upsertPage("now", { title: "Now", contentMd: "doing X" });

    const page = await getPageBySlug("now");
    expect(page?.title).toBe("Now");
    expect(page?.contentMd).toBe("doing X");
  });

  it("updates existing page in place", async () => {
    const { upsertPage, getPageBySlug, getAllPages } = await import("@/db/queries");
    await upsertPage("now", { title: "Now", contentMd: "v1" });
    await upsertPage("now", { title: "Now", contentMd: "v2" });

    const all = await getAllPages();
    expect(all).toHaveLength(1);
    const page = await getPageBySlug("now");
    expect(page?.contentMd).toBe("v2");
  });

  it("preserves existing fields when input keys are absent", async () => {
    const { upsertPage, getPageBySlug } = await import("@/db/queries");
    await upsertPage("about", { title: "About", contentMd: "original" });
    await upsertPage("about", { title: "About v2" });

    const page = await getPageBySlug("about");
    expect(page?.title).toBe("About v2");
    expect(page?.contentMd).toBe("original");
  });

  it("defaults title to slug when creating without one", async () => {
    const { upsertPage, getPageBySlug } = await import("@/db/queries");
    await upsertPage("contact", {});
    const page = await getPageBySlug("contact");
    expect(page?.title).toBe("contact");
    expect(page?.contentMd).toBe("");
  });
});

describe("getPageBySlug", () => {
  it("returns null when no row matches", async () => {
    const { getPageBySlug } = await import("@/db/queries");
    expect(await getPageBySlug("missing")).toBeNull();
  });
});

describe("getPagesList", () => {
  it("returns lean rows (id/slug/title/updatedAt) without content_md", async () => {
    const { upsertPage, getPagesList } = await import("@/db/queries");
    await upsertPage("now", { title: "Now", contentMd: "body" });
    await upsertPage("about", { title: "About", contentMd: "body2" });

    const rows = await getPagesList();
    expect(rows).toHaveLength(2);
    expect(Object.keys(rows[0]).sort()).toEqual(["id", "slug", "title", "updatedAt"]);
    expect(rows.map((r) => r.slug).sort()).toEqual(["about", "now"]);
  });
});
