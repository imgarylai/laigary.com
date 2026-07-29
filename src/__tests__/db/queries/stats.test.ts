// @vitest-environment node

import { describe, it, expect } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { seedPost, seedPage, seedSection, seedNote, seedTag, seedWork } from "../../factories";

setupTestDb();

describe("getDashboardStats", () => {
  it("counts published/draft posts, notes, works, pages and tags", async () => {
    const { getDashboardStats } = await import("@/db/queries");

    await seedPost({ status: "published" });
    await seedPost({ status: "published" });
    await seedPost({ status: "draft" });
    await seedPage();
    await seedTag();
    const section = await seedSection();
    await seedNote(section.id);
    // Both statuses: the works card counts everything authored, like `notes`.
    await seedWork({ status: "published" });
    await seedWork({ status: "draft" });

    const s = await getDashboardStats();
    expect(s.postsTotal).toBe(3);
    expect(s.postsPublished).toBe(2);
    expect(s.postsDrafts).toBe(1);
    expect(s.notes).toBe(1);
    expect(s.works).toBe(2);
    expect(s.pages).toBe(1);
    expect(s.tags).toBe(1);
  });

  it("returns zeros on an empty db", async () => {
    const { getDashboardStats } = await import("@/db/queries");
    const s = await getDashboardStats();
    expect(s).toEqual({
      postsTotal: 0,
      postsPublished: 0,
      postsDrafts: 0,
      notes: 0,
      works: 0,
      pages: 0,
      tags: 0,
    });
  });
});
