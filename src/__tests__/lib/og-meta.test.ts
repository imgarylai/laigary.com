import { describe, expect, it } from "vitest";
import { canonicalLink, ogMeta } from "@/lib/og-meta";

const base = {
  title: "Two Sum",
  siteName: "Unconstrained",
  url: "https://laigary.com/interview/coding/two-sum",
  image: "https://laigary.com/api/og/interview/coding/two-sum",
  type: "article" as const,
};

function find(tags: Array<Record<string, string>>, key: string, value: string) {
  return tags.find((t) => t.property === value || t.name === value)?.[key];
}

describe("ogMeta", () => {
  it("should emit og and twitter tags when given the required fields", () => {
    const tags = ogMeta(base);
    expect(find(tags, "content", "og:title")).toBe("Two Sum");
    expect(find(tags, "content", "og:site_name")).toBe("Unconstrained");
    expect(find(tags, "content", "og:image")).toBe(base.image);
    expect(find(tags, "content", "og:url")).toBe(base.url);
    expect(find(tags, "content", "og:type")).toBe("article");
    expect(find(tags, "content", "twitter:card")).toBe("summary_large_image");
    expect(find(tags, "content", "twitter:image")).toBe(base.image);
  });

  it("should include description tags when a description is provided", () => {
    const tags = ogMeta({ ...base, description: "hello" });
    expect(find(tags, "content", "og:description")).toBe("hello");
    expect(find(tags, "content", "description")).toBe("hello");
    expect(find(tags, "content", "twitter:description")).toBe("hello");
  });

  it("should omit description tags when the description is empty", () => {
    const tags = ogMeta(base);
    expect(tags.some((t) => t.property === "og:description")).toBe(false);
  });
});

describe("og:image dimensions", () => {
  it("should declare 1200x630 when the image is an own og endpoint", () => {
    const tags = ogMeta(base);
    expect(find(tags, "content", "og:image:width")).toBe("1200");
    expect(find(tags, "content", "og:image:height")).toBe("630");
  });

  it("should omit dimensions when the image is an external cover", () => {
    const tags = ogMeta({ ...base, image: "https://assets.laigary.com/cover.png" });
    expect(tags.some((t) => t.property === "og:image:width")).toBe(false);
  });
});

describe("canonicalLink", () => {
  it("should produce a single rel=canonical entry when given a URL", () => {
    expect(canonicalLink("https://laigary.com/posts")).toEqual([
      { rel: "canonical", href: "https://laigary.com/posts" },
    ]);
  });
});

describe("article timestamps and locale", () => {
  it("should emit og:locale on every page", () => {
    expect(find(ogMeta(base), "content", "og:locale")).toBe("zh_TW");
  });

  it("should emit article times when the type is article and dates are given", () => {
    const tags = ogMeta({ ...base, publishedTime: "2026-07-19", modifiedTime: "2026-07-22" });
    expect(find(tags, "content", "article:published_time")).toBe("2026-07-19");
    expect(find(tags, "content", "article:modified_time")).toBe("2026-07-22");
  });

  it("should omit article times when the type is website", () => {
    const tags = ogMeta({ ...base, type: "website", publishedTime: "2026-07-19" });
    expect(tags.some((t) => t.property === "article:published_time")).toBe(false);
  });
});
