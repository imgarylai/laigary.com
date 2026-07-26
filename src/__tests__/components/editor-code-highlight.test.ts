// @vitest-environment jsdom
//
// Parity coverage for #169: what a code fence looks like while you write it and
// what it looks like once published must be the same thing.
//
// Two independent things used to break that. The hljs token classes were only
// themed under `.tm-prose`, so the editor computed colours and never painted
// them — a CSS concern, pinned by the `tm-code` scope in terminal.css rather
// than here. The other is behavioural and lives in this file: the editor bundled
// lowlight's `common` (~37 grammars) while lib/markdown.ts auto-detects within a
// 9-language subset, so the *same* untagged fence could resolve to different
// languages on the two sides. Both now read the list from lib/code-languages.
import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";
import { renderMarkdown } from "@/lib/markdown";

function makeEditor(content: string): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: createExtensions({ placeholder: "" }),
    content,
    contentType: "markdown",
  });
}

/** The hljs token classes the editor paints, in document order. */
function editorTokens(markdown: string): string[] {
  const editor = makeEditor(markdown);
  const spans = editor.view.dom.querySelectorAll("[class*='hljs-']");
  const tokens = [...spans].map((el) => el.className);
  editor.destroy();
  return tokens;
}

/** The hljs token classes the published page paints, in document order. */
async function renderedTokens(markdown: string): Promise<string[]> {
  const html = await renderMarkdown(markdown);
  return [...html.matchAll(/class="(hljs-[^"]*)"/g)].map((m) => m[1]);
}

const PYTHON = "```\ndef fib(n):\n    return n\n```";
const SQL = "```\nSELECT id FROM posts WHERE status = 'published';\n```";

describe("editor code highlighting", () => {
  it("should paint hljs tokens when a fence names its language", () => {
    expect(editorTokens("```python\ndef fib(n):\n    return n\n```")).not.toHaveLength(0);
  });

  it("should paint hljs tokens when a fence uses a grammar alias", () => {
    // The corpus writes ```py; it must highlight, not fall through to plain.
    expect(editorTokens("```py\ndef fib(n):\n    return n\n```")).not.toHaveLength(0);
  });

  it("should auto-detect an untagged fence rather than leaving it uncoloured", () => {
    expect(editorTokens(PYTHON)).not.toHaveLength(0);
  });

  it("should tokenise an untagged fence exactly as the published page does", async () => {
    // The regression guard: a grammar registered on one side only would shift
    // the auto-detected language and change these tokens.
    expect(editorTokens(PYTHON)).toEqual(await renderedTokens(PYTHON));
    expect(editorTokens(SQL)).toEqual(await renderedTokens(SQL));
  });

  it("should leave a text fence uncoloured since ```text opts out of highlighting", async () => {
    const output = "```text\n$ pnpm build\n  done in 3.21s\n```";

    expect(editorTokens(output)).toHaveLength(0);
    expect(await renderedTokens(output)).toHaveLength(0);
  });
});
