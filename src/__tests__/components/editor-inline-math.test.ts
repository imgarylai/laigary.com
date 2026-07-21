// @vitest-environment jsdom
//
// LaTeX round-trip through the official @tiptap/markdown bridge.
//
// The community tiptap-markdown bridge did not know the inlineMath node and
// serialized it as a raw HTML span with HTML-escaped entities — `&gt;` leaked
// into stored markdown and broke the frontend temml render (ParseError).
// These tests pin the markdown mapping in editor/inline-math.ts: `$...$` in
// stored content becomes an inlineMath node, and the node serializes back to
// `$...$` — never HTML, entities intact.
import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { createExtensions } from "@/components/admin/editor/extensions";
import { matchDollarMath } from "@/components/admin/editor/inline-math";

function makeEditor(content = ""): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: createExtensions({ placeholder: "" }),
    content,
    contentType: "markdown",
  });
}

function findMathNodes(node: JSONContent): JSONContent[] {
  const own = node.type === "inlineMath" ? [node] : [];
  return [...own, ...(node.content ?? []).flatMap(findMathNodes)];
}

describe("matchDollarMath", () => {
  it("should match single-dollar math when content has no flanking whitespace", () => {
    expect(matchDollarMath("$x_1$ rest")).toEqual({ raw: "$x_1$", latex: "x_1", display: false });
  });

  it("should match double-dollar math as display when delimiters are doubled", () => {
    expect(matchDollarMath("$$a > b$$")).toEqual({
      raw: "$$a > b$$",
      latex: "a > b",
      display: true,
    });
  });

  it("should reject single-dollar spans with flanking whitespace when matching", () => {
    expect(matchDollarMath("$ 5 and $10")).toBeNull();
  });

  it("should reject a closing dollar followed by a digit when matching", () => {
    expect(matchDollarMath("$5 and $10 total")).toBeNull();
  });

  it("should return null when the source does not start with a dollar", () => {
    expect(matchDollarMath("plain text")).toBeNull();
  });
});

describe("markdown -> inlineMath node", () => {
  it("should parse dollar math into an inlineMath node when loading markdown", () => {
    const editor = makeEditor("給一個數字 $(fast - slow) - max_count > k$，我們要回傳一個陣列");
    const nodes = findMathNodes(editor.getJSON());
    expect(nodes).toHaveLength(1);
    expect(nodes[0].attrs?.latex).toBe("(fast - slow) - max_count > k");
    expect(nodes[0].attrs?.display).toBe("no");
  });

  it("should parse double-dollar math with display=yes when loading markdown", () => {
    const editor = makeEditor("$$\\sum_i i$$");
    const nodes = findMathNodes(editor.getJSON());
    expect(nodes).toHaveLength(1);
    expect(nodes[0].attrs?.latex).toBe("\\sum_i i");
    expect(nodes[0].attrs?.display).toBe("yes");
  });

  it("should leave dollar prices as plain text when loading markdown", () => {
    const editor = makeEditor("it costs $5 and $10 total");
    expect(findMathNodes(editor.getJSON())).toHaveLength(0);
  });
});

describe("inlineMath node -> markdown", () => {
  it("should serialize math back to dollar syntax when content contains > and <", () => {
    const md = "給一個數字 $(fast - slow) - max_count > k$，我們要回傳一個陣列";
    const editor = makeEditor(md);
    const out = editor.getMarkdown();
    expect(out).toContain("$(fast - slow) - max_count > k$");
    expect(out).not.toContain("&gt;");
    expect(out).not.toContain("<span");
  });

  it("should round-trip a document mixing math, inline code, and CJK when serializing", () => {
    const md = "邏輯拆解:$max_count$ 代表 `count`,成本是 $k$ 次";
    const editor = makeEditor(md);
    expect(editor.getMarkdown()).toBe(md);
  });

  it("should self-heal legacy html-span math into dollar syntax when re-serializing", () => {
    // Shape produced by the old community bridge for the 3 polluted notes:
    // an HTML span with entity-escaped latex. The node's parseHTML rule picks
    // it up (entities decoded by the DOM), so saving re-emits clean markdown.
    const legacy =
      '<span data-latex="(fast - slow) - max_count &gt; k" data-evaluate="no" data-display="no" data-type="inlineMath">$(fast - slow) - max_count &gt; k$</span>';
    const editor = makeEditor(legacy);
    expect(editor.getMarkdown()).toBe("$(fast - slow) - max_count > k$");
  });
});
