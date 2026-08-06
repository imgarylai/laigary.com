import { describe, it, expect } from "vitest";
import { displayWidth, plainExcerpt, truncateToWidth } from "@/lib/og/excerpt";

describe("displayWidth", () => {
  it("should count latin characters as one column each", () => {
    expect(displayWidth("hello")).toBe(5);
  });

  it("should count CJK characters as two columns each", () => {
    // The whole reason this module exists: budgeting by String.length would
    // treat these as five, and the line would run off the card.
    expect(displayWidth("開發網頁編")).toBe(10);
  });

  it("should add up a mixed string", () => {
    expect(displayWidth("我用 Rails")).toBe(4 + 6);
  });
});

describe("truncateToWidth", () => {
  it("should leave a string that already fits alone", () => {
    expect(truncateToWidth("short", 20)).toBe("short");
  });

  it("should cut latin text to the budget including the ellipsis", () => {
    const out = truncateToWidth("abcdefghij", 5);
    expect(displayWidth(out)).toBeLessThanOrEqual(5);
    expect(out.endsWith("…")).toBe(true);
  });

  it("should never split the budget across half a CJK glyph", () => {
    // Six columns of budget, one taken by the ellipsis, leaves room for two
    // wide characters and not a third.
    const out = truncateToWidth("開發網頁編輯器", 6);
    expect(out).toBe("開發…");
    expect(displayWidth(out)).toBeLessThanOrEqual(6);
  });

  it("should fill a CJK line to the same visual length as a latin one", () => {
    // The point of the whole module: both fill the budget, so neither looks
    // half-length next to the other. They can differ by a single column,
    // because a wide glyph cannot be split to use up an odd remainder.
    const cjk = truncateToWidth("開".repeat(100), 40);
    const latin = truncateToWidth("a".repeat(100), 40);
    expect(Math.abs(displayWidth(cjk) - displayWidth(latin))).toBeLessThanOrEqual(1);
    expect(displayWidth(cjk)).toBeGreaterThanOrEqual(39);
  });
});

describe("plainExcerpt", () => {
  it("should strip markdown markup down to its text", () => {
    const md = "## 標題\n\n這是 **粗體** 和 `code` 還有 [連結](https://example.com)。";
    expect(plainExcerpt(md, 200)).toBe("標題 這是 粗體 和 code 還有 連結。");
  });

  it("should drop fenced code, tables and images", () => {
    const md = [
      "開頭。",
      "",
      "```ts",
      "const x = 1;",
      "```",
      "",
      "| a | b |",
      "| - | - |",
      "",
      "![alt](img.png)",
      "",
      "結尾。",
    ].join("\n");
    const out = plainExcerpt(md, 200);
    expect(out).toContain("開頭。");
    expect(out).toContain("結尾。");
    expect(out).not.toContain("const x");
    expect(out).not.toContain("|");
    expect(out).not.toContain("img.png");
  });

  it("should collapse the source's own line breaks into one paragraph", () => {
    expect(plainExcerpt("一行\n二行\n\n三行", 200)).toBe("一行 二行 三行");
  });

  it("should keep the result inside the width budget", () => {
    const md = "先講結論好了：".repeat(50);
    expect(displayWidth(plainExcerpt(md, 60))).toBeLessThanOrEqual(60);
  });
});
