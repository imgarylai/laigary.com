import { describe, it, expect } from "vitest";
import {
  articleTemplate,
  formatOgDate,
  formatOgDateFromIsoDay,
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
  it("should format unix seconds as a zh-TW long date when given a timestamp", () => {
    // Exact day, not `(19|20)`: vitest.config.ts pins TZ=UTC, so there is one
    // right answer. 1752960000 is 2025-07-19T20:00:00Z.
    expect(formatOgDate(1752960000)).toBe("2025年7月19日");
  });

  it("should return null when the timestamp is null or undefined", () => {
    expect(formatOgDate(null)).toBeNull();
    expect(formatOgDate(undefined)).toBeNull();
  });

  it("should return null when the timestamp is not finite", () => {
    expect(formatOgDate(Number.NaN)).toBeNull();
  });
});

describe("formatOgDateFromIsoDay", () => {
  it("should format a yyyy-MM-dd string without timezone shifting when parsing", () => {
    expect(formatOgDateFromIsoDay("2025-07-19")).toBe("2025年7月19日");
  });

  it("should strip leading zeros when the month or day is single-digit", () => {
    expect(formatOgDateFromIsoDay("2025-01-05")).toBe("2025年1月5日");
  });

  it("should return null when the input is not a yyyy-MM-dd string", () => {
    expect(formatOgDateFromIsoDay("not a date")).toBeNull();
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
    const node = articleTemplate({ ...base, title: "t", dateLabel: "2025年7月19日" });
    expect(flattenText(node)).toContain("2025年7月19日");
  });
});

describe("postTemplate", () => {
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
