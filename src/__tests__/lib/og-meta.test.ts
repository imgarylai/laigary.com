import { describe, expect, it } from "vitest";
import { ogMeta } from "@/lib/og-meta";

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
