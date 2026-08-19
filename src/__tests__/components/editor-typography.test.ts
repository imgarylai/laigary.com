// @vitest-environment happy-dom
//
// The em-dash input rule, scoped so it cannot eat a `---` divider.
//
// Typography's own rule is `/--$/`, so typing three hyphens went `-`, `—`,
// `—-`. The horizontal rule still appeared (its rule carries `—-` for exactly
// that reason), but the text behind it was an em-dash plus a hyphen — which is
// what Backspace's undoInputRule handed back, reading as "the divider turned
// into two dashes".
import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";

function makeEditor(): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: createExtensions({ placeholder: "" }),
    content: "",
    contentType: "markdown",
  });
}

/** Simulate real typing so input rules see each character as it arrives. */
function type(editor: Editor, text: string): void {
  for (const char of text) {
    const { from, to } = editor.state.selection;
    const handled = editor.view.someProp("handleTextInput", (handler) =>
      handler(editor.view, from, to, char, () => editor.state.tr.insertText(char, from, to)),
    );
    if (!handled) editor.view.dispatch(editor.state.tr.insertText(char, from, to));
  }
}

function hasNode(editor: Editor, name: string): boolean {
  let found = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === name) found = true;
  });
  return found;
}

describe("em dash input rule", () => {
  it("should convert a pair that follows text", () => {
    const editor = makeEditor();
    type(editor, "a--");
    expect(editor.state.doc.textContent).toBe("a—");
    editor.destroy();
  });

  it("should convert a pair that follows a space", () => {
    const editor = makeEditor();
    type(editor, "word --");
    expect(editor.state.doc.textContent).toBe("word —");
    editor.destroy();
  });

  it("should leave a pair alone at the start of a block", () => {
    const editor = makeEditor();
    type(editor, "--");
    // The two hyphens have to survive as hyphens, or the third one arrives
    // after an em-dash and the divider's source text is no longer what was typed.
    expect(editor.state.doc.textContent).toBe("--");
    expect(hasNode(editor, "horizontalRule")).toBe(false);
    editor.destroy();
  });

  it("should let three hyphens become a horizontal rule with no em-dash left behind", () => {
    const editor = makeEditor();
    type(editor, "---");
    expect(hasNode(editor, "horizontalRule")).toBe(true);
    expect(editor.state.doc.textContent).not.toContain("—");
    editor.destroy();
  });

  // The known limit, pinned so it is a decision rather than a surprise: an
  // input rule fires on the keystroke it sees, so a pair mid-line converts
  // before any third hyphen exists. Only the divider case — where the pair sits
  // at the start of the block — can be told apart in time, and that is the one
  // that mattered. Matches Typography's own long-standing behaviour.
  it("should still convert a mid-line pair even when a third hyphen follows", () => {
    const editor = makeEditor();
    type(editor, "a---");
    expect(editor.state.doc.textContent).toBe("a—-");
    editor.destroy();
  });
});

describe("typography rules that stay off", () => {
  // Each of these triggers means something else in technical prose, so the
  // replacement would be a character the author never asked for. Reverting any
  // one of them to Typography's default fails here.
  it.each([
    ["<<", "a<<b"],
    [">>", "a>>b"],
    ["(c)", "(c) 第三項"],
    ["(r)", "(r) 註"],
    ["(tm)", "(tm) 註"],
  ])("should leave %s alone", (_label, input) => {
    const editor = makeEditor();
    type(editor, input);
    expect(editor.state.doc.textContent).toBe(input);
    editor.destroy();
  });
});

describe("typography rules that stay on", () => {
  // The other half of the audit: these replace a sequence that is genuinely
  // reaching for the symbol, so turning them off would be a regression too.
  it.each([
    ["ellipsis", "a...", "a…"],
    ["right arrow", "a->b", "a→b"],
    ["left arrow", "a<-b", "a←b"],
    ["not equal", "a!=b", "a≠b"],
    ["multiplication", "2x2", "2×2"],
  ])("should still apply %s", (_label, input, expected) => {
    const editor = makeEditor();
    type(editor, input);
    expect(editor.state.doc.textContent).toBe(expected);
    editor.destroy();
  });

  // Not a Typography rule but the reason the whole audit only had to weigh
  // prose: Tiptap's input-rule runner bails next to a `code` mark and inside a
  // code block, so none of the above can touch code the author is quoting.
  it("should never fire inside inline code", () => {
    const editor = makeEditor();
    editor.commands.setMark("code");
    type(editor, "a->b != c...");
    expect(editor.state.doc.textContent).toBe("a->b != c...");
    editor.destroy();
  });

  it("should never fire inside a code block", () => {
    const editor = makeEditor();
    editor.commands.setCodeBlock();
    type(editor, "a->b != c...");
    expect(editor.state.doc.textContent).toBe("a->b != c...");
    editor.destroy();
  });
});
