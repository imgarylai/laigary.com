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
  getFeedPosts: vi.fn(async () => [
    {
      slug: "hello",
      title: "Hi",
      excerpt: "x",
      contentMd: "# Heading\n\nBody with `]]>` inside.",
      date: "2020-01-01T00:00:00.000Z",
    },
    {
      slug: "raw",
      title: "No excerpt",
      excerpt: null,
      contentMd: "Just a plain paragraph.",
      date: "2020-01-02T00:00:00.000Z",
    },
  ]),
  getSiteSettings: vi.fn(async () => ({
    site_url: "https://ex.com",
    site_name: "Ex",
    site_description: "d",
    locale: "en",
  })),
}));

import { buildSitemapXml } from "@/server/sitemap";
import { buildFeedXml } from "@/server/feed";
import { getFeedPosts, getSiteSettings } from "@/db/queries";

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
  it("should render an RSS channel with post items when posts exist", async () => {
    const xml = await buildFeedXml();
    expect(xml).toContain("<rss");
    expect(xml).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
    expect(xml).toContain("<title>Ex</title>");
    expect(xml).toContain("<link>https://ex.com</link>");
    expect(xml).toContain("https://ex.com/posts/hello");
    expect(xml).toContain("<![CDATA[Hi]]>");
    expect(xml).toContain("<language>en</language>");
  });

  it("should embed the full rendered body as content:encoded when building items", async () => {
    const xml = await buildFeedXml();
    expect(xml).toContain("<content:encoded>");
    expect(xml).toContain("<h1>Heading</h1>");
  });

  it("should split CDATA when the rendered content contains ]]>", async () => {
    const xml = await buildFeedXml();
    // The raw `]]>` from the markdown never appears unescaped inside a CDATA
    // payload — it's split into `]]]]><![CDATA[>`.
    expect(xml).toContain("]]]]><![CDATA[>");
  });

  it("should fall back to a plain-text summary when a post has no excerpt", async () => {
    const xml = await buildFeedXml();
    expect(xml).toContain("<description><![CDATA[Just a plain paragraph.]]></description>");
  });

  it("should truncate the summary and use channel defaults when settings are bare", async () => {
    vi.mocked(getSiteSettings).mockResolvedValueOnce({});
    vi.mocked(getFeedPosts).mockResolvedValueOnce([
      {
        slug: "long",
        title: "Long",
        excerpt: null,
        contentMd: "word ".repeat(100),
        date: "2020-01-01T00:00:00.000Z",
      },
    ]);

    const xml = await buildFeedXml();
    expect(xml).toContain("<title>Blog</title>");
    expect(xml).toContain("<language>zh-TW</language>");
    expect(xml).toContain("https://laigary.com/posts/long");
    // 500 chars of body collapse into a 280-char summary with an ellipsis.
    expect(xml).toContain("…]]></description>");
  });
});
