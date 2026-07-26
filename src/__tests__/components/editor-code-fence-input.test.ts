// @vitest-environment jsdom
//
// The opening-fence input rule (#172).
//
// The default rule captured whatever word followed ``` and made it the
// language, so typing ` ``` ` and carrying on with `const x = 1;` produced a
// block tagged ```const with `const` deleted from the code. A word now only
// becomes the language when it names a registered grammar; anything else is
// treated as the code it is.
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
      handler(editor.view, from, to, char),
    );
    if (!handled) editor.view.dispatch(editor.state.tr.insertText(char, from, to));
  }
}

function pressEnter(editor: Editor): void {
  editor.view.someProp("handleKeyDown", (handler) =>
    handler(editor.view, new KeyboardEvent("keydown", { key: "Enter" })),
  );
}

function codeText(editor: Editor): string {
  let text = "";
  editor.state.doc.descendants((node) => {
    if (node.type.name === "codeBlock") text = node.textContent;
  });
  return text;
}

function language(editor: Editor): string | null {
  let value: string | null = null;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "codeBlock") value = node.attrs.language;
  });
  return value;
}

describe("code fence input rule", () => {
  it("should keep the following word as code when it does not name a language", () => {
    // The bug this rule exists for: `const` used to become the language and
    // vanish from the code.
    const editor = makeEditor();

    type(editor, "```const x = 1;");

    expect(editor.isActive("codeBlock")).toBe(true);
    expect(codeText(editor)).toBe("const x = 1;");
    expect(language(editor)).toBe(null);
    editor.destroy();
  });

  it("should keep the space that triggered the rule so words do not run together", () => {
    // ProseMirror only inserts the triggering character when no rule handles
    // the input, so the rule has to put it back itself.
    const editor = makeEditor();

    type(editor, "```const ");

    expect(codeText(editor)).toBe("const ");
    editor.destroy();
  });

  it("should tag the block when the word does name a registered grammar", () => {
    const editor = makeEditor();

    type(editor, "```python ");

    expect(language(editor)).toBe("python");
    expect(codeText(editor)).toBe("");
    editor.destroy();
  });

  it("should accept a grammar alias since the corpus writes ```py", () => {
    const editor = makeEditor();

    type(editor, "```py ");

    expect(language(editor)).toBe("py");
    expect(codeText(editor)).toBe("");
    editor.destroy();
  });

  it("should open an untagged block when the fence is closed by a space alone", () => {
    const editor = makeEditor();

    type(editor, "``` ");

    expect(editor.isActive("codeBlock")).toBe(true);
    expect(language(editor)).toBe(null);
    expect(codeText(editor)).toBe("");
    editor.destroy();
  });

  it("should open an untagged block on Enter without leaving a stray newline", () => {
    // Enter is the deliberate "just give me a block" door; the keystroke that
    // opened it must not also land in the code.
    const editor = makeEditor();

    type(editor, "```");
    pressEnter(editor);

    expect(editor.isActive("codeBlock")).toBe(true);
    expect(language(editor)).toBe(null);
    expect(codeText(editor)).toBe("");
    editor.destroy();
  });

  it("should open a block from a tilde fence as markdown allows", () => {
    const editor = makeEditor();

    type(editor, "~~~python ");

    expect(editor.isActive("codeBlock")).toBe(true);
    expect(language(editor)).toBe("python");
    editor.destroy();
  });

  it("should never serialize a language the editor cannot highlight", () => {
    // `rust` is a real language but is not among the registered grammars, so it
    // is treated as code rather than silently producing a fence that stays
    // grey in the editor. The picker (#170) is how a language gets set.
    const editor = makeEditor();

    type(editor, "```rust ");

    expect(language(editor)).toBe(null);
    expect(codeText(editor)).toBe("rust ");
    editor.destroy();
  });
});
