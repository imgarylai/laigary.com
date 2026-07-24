import { describe, it, expect } from "vitest";
import { extractToc } from "@/lib/toc";
import { renderMarkdown } from "@/lib/markdown";

describe("extractToc", () => {
  it("should collect h2 and h3 in document order when given rendered html", () => {
    const html = '<h2 id="a">First</h2><p>x</p><h3 id="b">Deeper</h3><h2 id="c">Second</h2>';
    expect(extractToc(html)).toEqual([
      { depth: 2, text: "First", id: "a" },
      { depth: 3, text: "Deeper", id: "b" },
      { depth: 2, text: "Second", id: "c" },
    ]);
  });

  it("should ignore h1 and h4 when collecting entries", () => {
    const html = '<h1 id="t">Title</h1><h2 id="a">Kept</h2><h4 id="d">Dropped</h4>';
    expect(extractToc(html).map((e) => e.id)).toEqual(["a"]);
  });

  it("should flatten inline markup to text when a heading contains code or emphasis", () => {
    const html = '<h2 id="a"><strong>為何 <code>range(n)</code>?</strong></h2>';
    expect(extractToc(html)[0].text).toBe("為何 range(n)?");
  });

  it("should decode entities when the heading text was escaped", () => {
    const html = '<h2 id="a">Array &#x26; Two Pointers &lt;3</h2>';
    expect(extractToc(html)[0].text).toBe("Array & Two Pointers <3");
  });

  it("should skip headings that have no id since they cannot be anchored", () => {
    const html = '<h2>No id</h2><h2 id="ok">Has id</h2>';
    expect(extractToc(html).map((e) => e.id)).toEqual(["ok"]);
  });

  it("should return an empty array when there are no headings", () => {
    expect(extractToc("<p>just text</p>")).toEqual([]);
  });
});

// The contract that matters: every id the TOC links to must exist as a heading
// id in the same html. These run the real pipeline rather than fixtures so a
// change in slug generation cannot silently break the anchors.
describe("extractToc over the real markdown pipeline", () => {
  const idsIn = (html: string) => [...html.matchAll(/<h[23][^>]*\bid="([^"]*)"/g)].map((m) => m[1]);

  it("should produce ids that match the rendered heading ids for cjk headings", async () => {
    const html = await renderMarkdown("## 三種基本型\n\n### 去重：排序 + 同層跳過\n\ntext");
    const toc = extractToc(html);
    expect(toc.map((e) => e.id)).toEqual(idsIn(html));
    expect(toc).toEqual([
      { depth: 2, text: "三種基本型", id: "三種基本型" },
      { depth: 3, text: "去重：排序 + 同層跳過", id: "去重排序--同層跳過" },
    ]);
  });

  it("should stay aligned with rehype-slug's duplicate counter across all heading levels", async () => {
    // rehype-slug numbers duplicates across every level, so the h4 in the
    // middle consumes `剪枝-1` — a markdown-only scan would mislabel the last
    // heading as `剪枝-1` and link to the wrong section.
    const html = await renderMarkdown("## 剪枝\n\n#### 剪枝\n\n## 剪枝");
    const toc = extractToc(html);
    expect(toc.map((e) => e.id)).toEqual(["剪枝", "剪枝-2"]);
    expect(idsIn(html)).toEqual(["剪枝", "剪枝-2"]);
  });

  it("should not treat ## inside a fenced code block as a heading", async () => {
    const html = await renderMarkdown("## Real\n\n```bash\n## not a heading\n```\n\n## Also real");
    expect(extractToc(html).map((e) => e.text)).toEqual(["Real", "Also real"]);
  });

  it("should keep ids linkable when the heading holds inline code", async () => {
    const html = await renderMarkdown("## `bisect` — 在排序陣列上二分");
    const toc = extractToc(html);
    expect(toc[0].text).toBe("bisect — 在排序陣列上二分");
    expect(idsIn(html)).toEqual([toc[0].id]);
  });
});
