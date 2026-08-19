// @vitest-environment happy-dom
//
// Behavioural coverage for the code block card (#170) and its keymap (#171),
// driven through a real editor rather than the pure helpers in
// editor-code-indent.test.ts.
import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import { createExtensions } from "@/components/admin/editor/extensions";

function makeEditor(content = ""): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: createExtensions({ placeholder: "" }),
    content,
    contentType: "markdown",
  });
}

/** Put the cursor / selection inside the document's only code block, using
 *  offsets relative to its text. */
function selectInCode(editor: Editor, from: number, to = from): void {
  let contentStart = 0;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "codeBlock") contentStart = pos + 1;
  });
  const { state } = editor;
  editor.view.dispatch(
    state.tr.setSelection(TextSelection.create(state.doc, contentStart + from, contentStart + to)),
  );
}

function codeText(editor: Editor): string {
  let text = "";
  editor.state.doc.descendants((node) => {
    if (node.type.name === "codeBlock") text = node.textContent;
  });
  return text;
}

function press(editor: Editor, key: string, mods: Partial<KeyboardEvent> = {}): void {
  editor.view.someProp("handleKeyDown", (handler) =>
    handler(editor.view, new KeyboardEvent("keydown", { key, ...mods })),
  );
}

describe("code block keymap", () => {
  it("should insert an indent when Tab is pressed with the caret inside a code block", () => {
    const editor = makeEditor("```python\nreturn n\n```");
    selectInCode(editor, 0);

    press(editor, "Tab");

    expect(codeText(editor)).toBe("  return n");
    editor.destroy();
  });

  it("should indent every selected line when Tab is pressed across a multi-line selection", () => {
    const editor = makeEditor("```python\na = 1\nb = 2\nc = 3\n```");
    selectInCode(editor, 0, "a = 1\nb = 2".length);

    press(editor, "Tab");

    expect(codeText(editor)).toBe("  a = 1\n  b = 2\nc = 3");
    editor.destroy();
  });

  it("should keep focus in the editor when Tab is pressed so the article is not left", () => {
    // The original bug: ProseMirror leaves Tab to the browser, and the editor
    // is mounted inside a <form>, so focus jumped to the submit button.
    const editor = makeEditor("```python\nreturn n\n```");
    selectInCode(editor, 0);

    const handled = editor.view.someProp("handleKeyDown", (handler) =>
      handler(editor.view, new KeyboardEvent("keydown", { key: "Tab" })),
    );

    expect(handled).toBe(true);
    editor.destroy();
  });

  it("should leave Tab alone when the caret is outside a code block so focus can still move", () => {
    const editor = makeEditor("just a paragraph");
    editor.commands.setTextSelection(2);

    const handled = editor.view.someProp("handleKeyDown", (handler) =>
      handler(editor.view, new KeyboardEvent("keydown", { key: "Tab" })),
    );

    expect(handled).toBeFalsy();
    editor.destroy();
  });

  it("should remove one indent level when Shift-Tab is pressed on an indented line", () => {
    const editor = makeEditor("```python\n    deep\n```");
    selectInCode(editor, 6);

    press(editor, "Tab", { shiftKey: true });

    expect(codeText(editor)).toBe("  deep");
    editor.destroy();
  });

  it("should outdent every selected line when Shift-Tab spans a multi-line selection", () => {
    const editor = makeEditor("```python\n  a = 1\n  b = 2\n```");
    selectInCode(editor, 0, "  a = 1\n  b = 2".length);

    press(editor, "Tab", { shiftKey: true });

    expect(codeText(editor)).toBe("a = 1\nb = 2");
    editor.destroy();
  });

  it("should leave content untouched when Shift-Tab hits a line that is already flush", () => {
    const editor = makeEditor("```python\nflush\n```");
    selectInCode(editor, 2);

    press(editor, "Tab", { shiftKey: true });

    expect(codeText(editor)).toBe("flush");
    editor.destroy();
  });

  it("should exit below the block when Mod-Enter is pressed from the middle of it", () => {
    // ArrowDown only escapes from the last line; this works from anywhere.
    const editor = makeEditor("```python\na = 1\nb = 2\n```");
    selectInCode(editor, 2);

    press(editor, "Enter", { ctrlKey: true });
    press(editor, "Enter", { metaKey: true });

    expect(editor.isActive("codeBlock")).toBe(false);
    expect(codeText(editor)).toBe("a = 1\nb = 2");
    editor.destroy();
  });

  it("should lift an empty code block to a paragraph when Backspace is pressed at its start", () => {
    const editor = makeEditor("```python\n\n```");
    selectInCode(editor, 0);

    press(editor, "Backspace");

    expect(editor.isActive("codeBlock")).toBe(false);
    editor.destroy();
  });

  it("should keep a non-empty code block when Backspace is pressed at its start", () => {
    const editor = makeEditor("```python\nkeep me\n```");
    selectInCode(editor, 0);

    press(editor, "Backspace");

    expect(editor.isActive("codeBlock")).toBe(true);
    expect(codeText(editor)).toBe("keep me");
    editor.destroy();
  });
});

describe("code block language attribute", () => {
  it("should round-trip a named language through markdown", () => {
    const editor = makeEditor("```python\nreturn n\n```");

    expect(editor.getMarkdown()).toContain("```python");
    editor.destroy();
  });

  it("should serialize a bare fence when the language is cleared to auto-detect", () => {
    // What the card's "Auto-detect" option writes: language = null.
    const editor = makeEditor("```python\nreturn n\n```");
    selectInCode(editor, 0);

    editor.commands.updateAttributes("codeBlock", { language: null });

    expect(editor.getMarkdown()).not.toContain("```python");
    expect(editor.getMarkdown()).toContain("```");
    editor.destroy();
  });

  it("should serialize the new language when it is changed on an existing block", () => {
    // The whole point of the card: a mistagged fence is fixable in place
    // instead of having to be deleted and retyped.
    const editor = makeEditor("```python\nSELECT 1;\n```");
    selectInCode(editor, 0);

    editor.commands.updateAttributes("codeBlock", { language: "sql" });

    expect(editor.getMarkdown()).toContain("```sql");
    expect(codeText(editor)).toBe("SELECT 1;");
    editor.destroy();
  });
});
