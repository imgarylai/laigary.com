// @vitest-environment jsdom
//
// The `/` menu driven through a mounted editor, which is the only way to reach
// the suggestion plugin's render lifecycle (#173).
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

afterEach(cleanup);

/** Simulate real typing through ProseMirror's input pipeline. */
function type(editor: Editor, text: string): void {
  for (const char of text) {
    const view = editor.view;
    const { from, to } = view.state.selection;
    const handled = view.someProp("handleTextInput", (f) =>
      f(view, from, to, char, () => view.state.tr.insertText(char, from, to)),
    );
    if (!handled) view.dispatch(view.state.tr.insertText(char, from, to));
  }
}

function pressInEditor(editor: Editor, key: string): void {
  editor.view.someProp("handleKeyDown", (handler) =>
    handler(editor.view, new KeyboardEvent("keydown", { key })),
  );
}

function MountedEditor({ onReady }: { onReady: (editor: Editor) => void }) {
  const editor = useEditor({
    immediatelyRender: true,
    extensions: createExtensions({ placeholder: "" }),
    content: "",
    contentType: "markdown",
  });
  useEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);
  return <EditorContent editor={editor} />;
}

async function mount(): Promise<Editor> {
  let editor: Editor | null = null;
  render(<MountedEditor onReady={(e) => (editor = e)} />);
  await waitFor(() => expect(editor).not.toBeNull());
  return editor!;
}

describe("slash menu integration", () => {
  it("should pop the menu when `/` is typed at the start of a block", async () => {
    const editor = await mount();

    act(() => type(editor, "/"));

    await waitFor(() => expect(screen.getByText("editor.slash.codeBlock")).toBeDefined());
  });

  it("should narrow the menu as the query is typed", async () => {
    const editor = await mount();

    act(() => type(editor, "/table"));

    await waitFor(() => expect(screen.getByText("editor.slash.table")).toBeDefined());
    expect(screen.queryByText("editor.slash.codeBlock")).toBeNull();
  });

  it("should insert the block and consume the typed query when Enter picks it", async () => {
    const editor = await mount();
    act(() => type(editor, "/code"));
    await waitFor(() => expect(screen.getByText("editor.slash.codeBlock")).toBeDefined());

    act(() => pressInEditor(editor, "Enter"));

    await waitFor(() => expect(editor.isActive("codeBlock")).toBe(true));
    // The `/code` the author typed must not survive as code.
    expect(editor.state.doc.textContent).not.toContain("/code");
  });

  it("should dismiss the menu on Escape without inserting anything", async () => {
    const editor = await mount();
    act(() => type(editor, "/code"));
    await waitFor(() => expect(screen.getByText("editor.slash.codeBlock")).toBeDefined());

    act(() => pressInEditor(editor, "Escape"));

    await waitFor(() => expect(screen.queryByText("editor.slash.codeBlock")).toBeNull());
    expect(editor.isActive("codeBlock")).toBe(false);
  });

  it("should stack the popup above the sticky toolbar", async () => {
    // The bug this replaces: SlashList carried `z-50`, but that div is
    // position: static, where z-index does nothing. The popup stacked at `auto`
    // and the editor's sticky toolbar (z-10) painted over it, arriving sliced
    // in half. The class has to be on the element floating-ui positions and
    // appends to <body> (#196).
    const editor = await mount();

    act(() => type(editor, "/"));
    await waitFor(() => expect(screen.getByText("editor.slash.codeBlock")).toBeDefined());

    const positioned = screen.getByText("editor.slash.codeBlock").closest("body > div");
    expect(positioned).not.toBeNull();
    expect(positioned!.className).toContain("z-50");
  });

  it("should not pop the menu for a slash inside a code block", async () => {
    // Paths and division are ordinary code; a menu there would be noise.
    const editor = await mount();
    act(() => type(editor, "```"));
    act(() => pressInEditor(editor, "Enter"));
    await waitFor(() => expect(editor.isActive("codeBlock")).toBe(true));

    act(() => type(editor, "a / b"));

    expect(screen.queryByText("editor.slash.codeBlock")).toBeNull();
    expect(editor.state.doc.textContent).toContain("a / b");
  });
});
