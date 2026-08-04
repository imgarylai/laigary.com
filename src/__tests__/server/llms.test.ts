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
  getPublishedWorks: vi.fn(async () => ({
    works: [
      { slug: "ranged", title: "Ranged", summary: "spans years", year: 2021, endYear: 2023 },
      { slug: "single", title: "Single", summary: "", year: 2025, endYear: null },
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
import {
  getSiteSettings,
  getPublishedPosts,
  getPublishedWorks,
  getPagesList,
  getInterviewSections,
  getPublishedNoteIndex,
} from "@/db/queries";

describe("buildLlmsTxt", () => {
  it("should render the llms.txt skeleton when settings exist", async () => {
    const txt = await buildLlmsTxt();
    expect(txt).toContain("# Ex");
    expect(txt).toContain("> A test blog");
    expect(txt).toContain("https://ex.com/sitemap.xml");
    expect(txt).toContain("https://ex.com/mcp");
  });

  it("should tell a crawler how to fetch any listed link as markdown", async () => {
    // The index below this line is HTML URLs; without the convention spelled
    // out, nothing in the file says they can be fetched as source instead.
    const txt = await buildLlmsTxt();
    expect(txt).toContain("Append `.md`");
    expect(txt).toContain("https://ex.com/posts/<slug>.md");
  });

  it("should list posts with optional excerpts when posts exist", async () => {
    const txt = await buildLlmsTxt();
    expect(txt).toContain("- [Hello](https://ex.com/posts/hello): The first post");
    expect(txt).toContain("- [Plain](https://ex.com/posts/plain)\n");
  });

  it("should list works with their year range and optional summary", async () => {
    // The year is the fact a crawler cannot get any other way without fetching
    // the page, and a work with no summary must not render a dangling colon.
    const txt = await buildLlmsTxt();
    expect(txt).toContain("- [Ranged (2021–2023)](https://ex.com/works/ranged): spans years");
    expect(txt).toContain("- [Single (2025)](https://ex.com/works/single)\n");
  });

  it("should list pages and section-labeled interview notes when they exist", async () => {
    const txt = await buildLlmsTxt();
    expect(txt).toContain("- [About](https://ex.com/about)");
    expect(txt).toContain("- [Coding: Two Sum](https://ex.com/interview/coding/two-sum)");
  });

  it("should fall back to defaults and omit empty sections when the site is bare", async () => {
    vi.mocked(getSiteSettings).mockResolvedValueOnce({});
    vi.mocked(getPublishedPosts).mockResolvedValueOnce({ posts: [], total: 0 } as never);
    vi.mocked(getPublishedWorks).mockResolvedValueOnce({ works: [], total: 0 } as never);
    vi.mocked(getPagesList).mockResolvedValueOnce([]);
    vi.mocked(getInterviewSections).mockResolvedValueOnce([] as never);
    vi.mocked(getPublishedNoteIndex).mockResolvedValueOnce([]);

    const txt = await buildLlmsTxt();
    expect(txt).toContain("# Unconstrained");
    expect(txt).toContain("https://laigary.com/sitemap.xml");
    expect(txt).not.toContain("\n> ");
    expect(txt).not.toContain("## Posts");
    expect(txt).not.toContain("## Works");
    expect(txt).not.toContain("## Pages");
    expect(txt).not.toContain("## Interview notes");
  });

  it("should fall back to the section slug when a note's section has no label", async () => {
    vi.mocked(getInterviewSections).mockResolvedValueOnce([] as never);
    const txt = await buildLlmsTxt();
    expect(txt).toContain("- [coding: Two Sum](https://ex.com/interview/coding/two-sum)");
  });
});
