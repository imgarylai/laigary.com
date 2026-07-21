// @vitest-environment jsdom
//
// Regression coverage for #52 (inline-code backticks appearing to "stay").
//
// The visible backticks turned out to be @tailwindcss/typography's
// code::before/::after pseudo-elements (disabled in styles.css) — the editor
// itself handles backticks correctly. These tests pin down that correctness:
// the input rule must consume the delimiters, and the markdown round-trip must
// stay clean, so real backtick characters can never leak into stored content.
import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";

function makeEditor(content = ""): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: createExtensions({ placeholder: "" }),
    content,
    contentType: "markdown",
  });
}

function getMarkdown(editor: Editor): string {
  return editor.getMarkdown();
}

/** Simulate real typing: handleTextInput first (input rules), then insert. */
function type(editor: Editor, text: string): void {
  for (const char of text) {
    const view = editor.view;
    const { from, to } = view.state.selection;
    const handled = view.someProp("handleTextInput", (f) => f(view, from, to, char));
    if (!handled) {
      view.dispatch(view.state.tr.insertText(char, from, to));
    }
  }
}

describe("inline code input rule", () => {
  it("should consume the backticks when typing `n` directly after CJK text", () => {
    const editor = makeEditor();
    type(editor, "給一個數字`n`");
    expect(getMarkdown(editor)).toBe("給一個數字`n`");
    const paragraph = editor.getJSON().content?.[0];
    const codeNode = paragraph?.content?.find((n) => n.marks?.some((m) => m.type === "code"));
    expect(codeNode?.text).toBe("n");
  });

  it("should consume the backticks when typing `n` after a space", () => {
    const editor = makeEditor();
    type(editor, "number `n`");
    expect(getMarkdown(editor)).toBe("number `n`");
  });

  it("should apply the code mark when text arrives via IME composition", async () => {
    const editor = makeEditor();
    // IME path: text lands in the doc without handleTextInput ever firing;
    // the input-rule plugin re-runs rules on compositionend (in a setTimeout).
    editor.view.dispatch(editor.view.state.tr.insertText("給一個數字`n`"));
    editor.view.dom.dispatchEvent(new CompositionEvent("compositionend"));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(getMarkdown(editor)).toBe("給一個數字`n`");
  });
});

describe("markdown load round-trip", () => {
  it("should round-trip CJK-adjacent inline code without gaining backticks", () => {
    const md =
      "題目的問題很簡單，給一個數字 `n`，我們要回傳一個陣列，陣列的長度就是 `n` ，每一個位置就是該數字有幾個 1";
    const editor = makeEditor(md);
    expect(getMarkdown(editor)).toBe(md);
  });
});
