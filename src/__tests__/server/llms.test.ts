// @vitest-environment node

import { describe, it, expect, vi } from "vitest";

vi.mock("@/db/queries", () => ({
  getSiteSettings: vi.fn(async () => ({
    site_url: "https://ex.com",
    site_name: "Ex",
    site_description: "A test blog",
  })),
  getPublishedPosts: vi.fn(async () => ({
    posts: [
      { slug: "hello", title: "Hello", excerpt: "The first post" },
      { slug: "plain", title: "Plain", excerpt: null },
    ],
    total: 2,
  })),
  getPagesList: vi.fn(async () => [{ id: "1", slug: "about", title: "About", updatedAt: 0 }]),
  getInterviewSections: vi.fn(async () => [{ slug: "coding", label: "Coding" }]),
  getPublishedNoteIndex: vi.fn(async () => [
    { slug: "two-sum", sectionSlug: "coding", title: "Two Sum" },
  ]),
}));

import { buildLlmsTxt } from "@/server/llms";

describe("buildLlmsTxt", () => {
  it("should render the llms.txt skeleton when settings exist", async () => {
    const txt = await buildLlmsTxt();
    expect(txt).toContain("# Ex");
    expect(txt).toContain("> A test blog");
    expect(txt).toContain("https://ex.com/sitemap.xml");
    expect(txt).toContain("https://ex.com/mcp");
  });

  it("should list posts with optional excerpts when posts exist", async () => {
    const txt = await buildLlmsTxt();
    expect(txt).toContain("- [Hello](https://ex.com/posts/hello): The first post");
    expect(txt).toContain("- [Plain](https://ex.com/posts/plain)\n");
  });

  it("should list pages and section-labeled interview notes when they exist", async () => {
    const txt = await buildLlmsTxt();
    expect(txt).toContain("- [About](https://ex.com/about)");
    expect(txt).toContain("- [Coding: Two Sum](https://ex.com/interview/coding/two-sum)");
  });
});
