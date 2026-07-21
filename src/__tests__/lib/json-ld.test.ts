import { describe, expect, it } from "vitest";
import {
  blogPostingLd,
  breadcrumbLd,
  serializeJsonLd,
  techArticleLd,
  webSiteLd,
} from "@/lib/json-ld";

describe("blogPostingLd", () => {
  const base = {
    slug: "tanstack-migration",
    title: "用 TanStack Start 重寫部落格",
    excerpt: "遷移紀錄",
    date: "2026-07-19",
    tags: ["tanstack", "cloudflare"],
    coverImageUrl: null,
  };

  it("should build a BlogPosting with og-image fallback when there is no cover", () => {
    const ld = blogPostingLd(base);
    expect(ld["@type"]).toBe("BlogPosting");
    expect(ld.headline).toBe(base.title);
    expect(ld.url).toBe("https://laigary.com/posts/tanstack-migration");
    expect(ld.image).toBe("https://laigary.com/api/og/posts/tanstack-migration");
    expect(ld.keywords).toBe("tanstack, cloudflare");
    expect(ld.datePublished).toBe("2026-07-19");
  });

  it("should prefer the cover image when one exists", () => {
    const ld = blogPostingLd({ ...base, coverImageUrl: "https://assets.laigary.com/c.png" });
    expect(ld.image).toBe("https://assets.laigary.com/c.png");
  });

  it("should omit description and keywords when excerpt and tags are empty", () => {
    const ld = blogPostingLd({ ...base, excerpt: null, tags: [] });
    expect("description" in ld).toBe(false);
    expect("keywords" in ld).toBe(false);
  });
});

describe("techArticleLd", () => {
  it("should build a TechArticle pointing at the note url and og image", () => {
    const ld = techArticleLd({
      slug: "two-sum",
      section: "coding",
      sectionLabel: "Coding",
      title: "1. Two Sum",
      date: "2026-07-01",
      tags: ["hash-map"],
    });
    expect(ld["@type"]).toBe("TechArticle");
    expect(ld.url).toBe("https://laigary.com/interview/coding/two-sum");
    expect(ld.image).toBe("https://laigary.com/api/og/interview/coding/two-sum");
    expect(ld.articleSection).toBe("Coding");
  });
});

describe("serializeJsonLd", () => {
  it("should escape angle brackets when the content could close the script tag", () => {
    const out = serializeJsonLd({ headline: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script>");
    expect(JSON.parse(out).headline).toBe("</script><script>alert(1)</script>");
  });
});

describe("webSiteLd", () => {
  it("should build a WebSite entity with the author when given a site name", () => {
    const ld = webSiteLd("Unconstrained");
    expect(ld["@type"]).toBe("WebSite");
    expect(ld.name).toBe("Unconstrained");
    expect(ld.url).toBe("https://laigary.com");
  });
});

describe("breadcrumbLd", () => {
  it("should number positions and omit item on the final crumb when building", () => {
    const ld = breadcrumbLd([
      { name: "~", path: "/" },
      { name: "posts", path: "/posts" },
      { name: "文章標題" },
    ]) as { itemListElement: Record<string, unknown>[] };
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0]).toMatchObject({ position: 1, item: "https://laigary.com/" });
    expect(ld.itemListElement[1]).toMatchObject({ position: 2, item: "https://laigary.com/posts" });
    expect(ld.itemListElement[2]).toMatchObject({ position: 3, name: "文章標題" });
    expect("item" in ld.itemListElement[2]).toBe(false);
  });
});
