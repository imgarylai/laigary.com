import { displayWidth } from "@/lib/og/excerpt";
import { describe, it, expect } from "vitest";
import {
  titleLines,
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

describe("editorial cards", () => {
  it("should show the public brand and domain when rendering the home card", () => {
    const text = flattenText(
      siteTemplate({
        siteName: "old name",
        description: "About software",
        siteUrl: "https://laigary.com/",
      }),
    );
    expect(text).toContain("Gary Lai");
    expect(text).toContain("About software");
    expect(text).toContain("laigary.com");
    expect(text).not.toContain("old name");
  });
  it("should label interview notes when rendering an article card", () => {
    const text = flattenText(
      articleTemplate({
        title: "Two Sum",
        branding: "legacy",
        dateLabel: "2026-09-28",
        kicker: "./interview/coding/",
      }),
    );
    expect(text).toContain("Technical notes");
    expect(text).toContain("Two Sum");
    expect(text).toContain("2026-09-28");
    expect(text).not.toContain("./interview/");
  });
  it("should show the headline and date when rendering a post", () => {
    const text = flattenText(
      postTemplate({ title: "開發網頁編輯器的十年筆記", dateLabel: "2026-09-28" }),
    );
    expect(text).toContain("開發網頁編輯器的十年筆記");
    expect(text).toContain("Writing");
    expect(text).toContain("2026-09-28");
    expect(text).not.toContain("Unused excerpt");
  });
});

describe("titleLines", () => {
  it("should keep a short title large when it fits", () => {
    expect(titleLines("Short title")).toEqual({ lines: ["Short title"], fontSize: 72 });
  });
  it("should bound very long mixed titles to three lines when text overflows", () => {
    const title = "十年後，做好一個 Web 編輯器依然很難。".repeat(15);
    const result = titleLines(title);
    expect(result.lines).toHaveLength(3);
    expect(result.lines[2]).toMatch(/…$/);
    expect(result.fontSize).toBe(52);
    expect(result.lines.every((line) => displayWidth(line) <= 37)).toBe(true);
  });
  it("should preserve English word boundaries when wrapping", () => {
    expect(titleLines("Building better products with thoughtful software").lines).toEqual([
      "Building better products with",
      "thoughtful software",
    ]);
  });
  it("should keep CJK closing punctuation off a new line when wrapping", () => {
    const { lines } = titleLines("十年後，做好一個文字編輯器，依然是一個重要的課題");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => !/^[，。！？：；、）】》」』]/.test(line))).toBe(true);
  });
  it("should allow extra width for broad letters when an unbroken title wraps", () => {
    expect(titleLines("W".repeat(90)).lines.every((line) => line.length <= 19)).toBe(true);
  });
  it("should measure CJK as wider than Latin when sizing the title", () => {
    expect(titleLines("開".repeat(30)).fontSize).toBe(titleLines("a".repeat(60)).fontSize);
  });
});
