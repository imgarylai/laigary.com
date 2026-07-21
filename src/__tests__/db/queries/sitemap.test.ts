// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { createTestDb } from "../helpers/test-db";

const harness = createTestDb();

vi.mock("drizzle-orm/d1", () => ({
  drizzle: () => harness.db,
}));

beforeEach(() => harness.truncateAll());
afterAll(() => harness.close());

describe("getSitemapData", () => {
  it("returns published posts/notes/pages and tags/sections with content", async () => {
    const { createTag, createPost, createSection, createNote, upsertPage, getSitemapData } =
      await import("@/db/queries");

    const tag = await createTag({ name: "Go", slug: "go" });
    await createPost({
      title: "Hello",
      slug: "hello",
      contentMd: "x",
      status: "published",
      tagIds: [tag.id],
    });
    // A draft post + an unused tag should be excluded.
    await createPost({ title: "Draft", slug: "draft", contentMd: "x" });

    const section = await createSection({
      slug: "leetcode",
      label: "LeetCode",
      blurb: "",
      icon: "",
    });
    await createNote({
      slug: "two-sum",
      sectionId: section.id,
      title: "Two Sum",
      status: "published",
    });
    // An empty section (no published notes) should be dropped.
    await createSection({ slug: "empty", label: "Empty", blurb: "", icon: "" });

    await upsertPage("about", { title: "About", contentMd: "hi" });

    const data = await getSitemapData();
    expect(data.posts.map((p) => p.slug)).toEqual(["hello"]);
    expect(data.tags.map((t) => t.slug)).toEqual(["go"]);
    expect(data.sections.map((s) => s.slug)).toEqual(["leetcode"]);
    expect(data.notes.map((n) => `${n.sectionSlug}/${n.slug}`)).toEqual(["leetcode/two-sum"]);
    expect(data.pages.map((p) => p.slug)).toEqual(["about"]);
  });
});
