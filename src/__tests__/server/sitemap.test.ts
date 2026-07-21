// @vitest-environment node

import { describe, it, expect, vi } from "vitest";

vi.mock("@/db/queries", () => ({
  getSitemapData: vi.fn(async () => ({
    posts: [{ slug: "hello", updatedAt: 1000 }],
    tags: [{ slug: "go", updatedAt: 1000 }],
    sections: [{ slug: "leetcode", updatedAt: 2000 }],
    notes: [{ slug: "two-sum", sectionSlug: "leetcode", updatedAt: 2000 }],
    pages: [{ slug: "about", updatedAt: 3000 }],
  })),
  getPublishedPosts: vi.fn(async () => ({
    posts: [{ slug: "hello", title: "Hi", excerpt: "x", date: "2020-01-01T00:00:00.000Z" }],
    total: 1,
  })),
  getSiteSettings: vi.fn(async () => ({
    site_url: "https://ex.com",
    site_name: "Ex",
    site_description: "d",
    locale: "en",
  })),
}));

import { buildSitemapXml } from "@/server/sitemap";
import { buildFeedXml } from "@/server/feed";

describe("buildSitemapXml", () => {
  it("lists home, section list pages, and every content URL", async () => {
    const xml = await buildSitemapXml();
    expect(xml).toContain("<urlset");
    expect(xml).toContain("<loc>https://ex.com/</loc>");
    expect(xml).toContain("<loc>https://ex.com/posts</loc>");
    expect(xml).toContain("https://ex.com/posts/hello");
    expect(xml).toContain("https://ex.com/tags/go");
    expect(xml).toContain("<loc>https://ex.com/interview/leetcode</loc>");
    expect(xml).toContain("https://ex.com/interview/leetcode/two-sum");
    expect(xml).toContain("<loc>https://ex.com/about</loc>");
    expect(xml).toContain("<lastmod>1970-01-01T00:16:40.000Z</lastmod>");
  });
});

describe("buildFeedXml", () => {
  it("renders an RSS channel with post items", async () => {
    const xml = await buildFeedXml();
    expect(xml).toContain("<rss");
    expect(xml).toContain("<title>Ex</title>");
    expect(xml).toContain("<link>https://ex.com</link>");
    expect(xml).toContain("https://ex.com/posts/hello");
    expect(xml).toContain("<![CDATA[Hi]]>");
    expect(xml).toContain("<language>en</language>");
  });
});
