import { describe, it, expect } from "vitest";
import {
  articleTemplate,
  formatOgDate,
  postTemplate,
  siteTemplate,
  type OgNode,
} from "@/lib/og/templates";

function flattenText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (node !== null && typeof node === "object" && "props" in node) {
    return flattenText((node as OgNode).props.children);
  }
  return "";
}

describe("formatOgDate", () => {
  it("should format unix seconds as an ISO day when given a timestamp", () => {
    // Exact day, not `(19|20)`: vitest.config.ts pins TZ=UTC, so there is one
    // right answer. 1752960000 is 2025-07-19T20:00:00Z.
    expect(formatOgDate(1752960000)).toBe("2025-07-19");
  });

  it("should return null when the timestamp is null or undefined", () => {
    expect(formatOgDate(null)).toBeNull();
    expect(formatOgDate(undefined)).toBeNull();
  });

  it("should return null when the timestamp is not finite", () => {
    expect(formatOgDate(Number.NaN)).toBeNull();
  });
});

describe("siteTemplate", () => {
  it("should render site name, description, and url when building the tree", () => {
    const node = siteTemplate({
      siteName: "啟靈工程師",
      description: "desc",
      siteUrl: "laigary.com",
    });
    const text = flattenText(node);
    expect(text).toContain("啟靈工程師");
    expect(text).toContain("desc");
    expect(text).toContain("laigary.com");
  });
});

describe("articleTemplate", () => {
  const base = { branding: "啟靈工程師 | laigary.com", dateLabel: null, kicker: null };

  it("should include the kicker line when one is provided", () => {
    const node = articleTemplate({ ...base, title: "t", kicker: "./interview/system-design/" });
    expect(flattenText(node)).toContain("./interview/system-design/");
  });

  it("should omit the kicker line when it is null", () => {
    const node = articleTemplate({ ...base, title: "t" });
    expect(flattenText(node)).not.toContain("./interview/");
  });

  it("should shrink the title font when the title exceeds 40 characters", () => {
    const short = articleTemplate({ ...base, title: "short" });
    const long = articleTemplate({ ...base, title: "x".repeat(41) });
    // Recursively find the node rendering the title text and read its font size
    // (the title is nested under the body wrapper in the terminal layout).
    const titleFontSize = (node: unknown, title: string): number | null => {
      if (node === null || typeof node !== "object" || !("props" in node)) return null;
      const n = node as OgNode;
      const size = (n.props.style as { fontSize?: number } | undefined)?.fontSize;
      if (typeof size === "number" && size >= 40 && flattenText(n) === title) return size;
      const kids = n.props.children;
      for (const c of Array.isArray(kids) ? kids : [kids]) {
        const found = titleFontSize(c, title);
        if (found !== null) return found;
      }
      return null;
    };
    expect(titleFontSize(short, "short")).toBe(60);
    expect(titleFontSize(long, "x".repeat(41))).toBe(48);
  });

  it("should render the date label when one is provided", () => {
    const node = articleTemplate({ ...base, title: "t", dateLabel: "2025-07-19" });
    expect(flattenText(node)).toContain("2025-07-19");
  });
});

describe("postTemplate", () => {
  const post = {
    branding: "b",
    dateLabel: "2026-08-05",
    kicker: "./posts/x.md",
    excerpt: "先講結論好了。",
  };

  /** Font size of the node rendering `text`, wherever it sits in the tree. */
  function sizeOf(node: unknown, text: string): number | null {
    if (node === null || typeof node !== "object" || !("props" in node)) return null;
    const n = node as OgNode;
    const size = (n.props.style as { fontSize?: number } | undefined)?.fontSize;
    if (n.props.children === text && typeof size === "number") return size;
    const kids = n.props.children;
    for (const c of Array.isArray(kids) ? kids : [kids]) {
      const found = sizeOf(c, text);
      if (found !== null) return found;
    }
    return null;
  }

  it("should keep a short title at the largest size", () => {
    const title = "開發網頁編輯器的十年筆記";
    expect(sizeOf(postTemplate({ ...post, title }), title)).toBe(36);
  });

  it("should step the size down rather than run a long title off the card", () => {
    // 55 columns: comfortably past what 36px fits, and the row cannot wrap
    // without breaking the block's alignment.
    const title = "Notes on building a WYSIWYG editor that stores Markdown";
    expect(sizeOf(postTemplate({ ...post, title }), title)).toBe(24);
  });

  it("should truncate a title too long even for the smallest size", () => {
    const title = "x".repeat(200);
    const node = postTemplate({ ...post, title });
    const text = flattenText(node);
    expect(text).not.toContain(title);
    expect(text).toContain("…");
  });

  it("should size a CJK title by display width, not character count", () => {
    // 30 CJK characters is 60 columns — the same budget as 60 latin ones, and
    // both have to land on the same step.
    const cjk = "開".repeat(30);
    const latin = "x".repeat(60);
    expect(sizeOf(postTemplate({ ...post, title: cjk }), cjk)).toBe(
      sizeOf(postTemplate({ ...post, title: latin }), latin),
    );
  });

  it("should render the post card as a front-matter block plus an excerpt", () => {
    const node = postTemplate({
      title: "開發網頁編輯器的十年筆記",
      branding: "b",
      dateLabel: "2026-08-05",
      kicker: "./posts/x.md",
      excerpt: "先講結論好了。",
    });
    const text = flattenText(node);
    // The fences are what make it read as file contents rather than a headline
    // with loose lines under it.
    expect(text).toContain("---");
    expect(text).toContain("title: ");
    expect(text).toContain("開發網頁編輯器的十年筆記");
    expect(text).toContain("先講結論好了。");
    expect(text).toContain("$ cat ./posts/x.md");
    expect(text).toContain("2026-08-05");
  });
});
