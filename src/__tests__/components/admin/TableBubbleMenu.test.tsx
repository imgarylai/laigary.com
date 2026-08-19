// @vitest-environment happy-dom
//
// Row, column and delete controls next to the table being edited (#197).
//
// The commands were never broken — they sat in the toolbar behind an unlabelled
// icon, greyed out until the caret was already in a table. So these tests are
// about two things: that the controls appear exactly when a table is being
// edited, and that each one changes the table rather than merely being called.

import { useEffect } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";
import { TableBubbleMenu } from "@/components/admin/editor/TableBubbleMenu";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

afterEach(cleanup);

function Harness({ onReady }: { onReady: (editor: Editor) => void }) {
  const editor = useEditor({
    immediatelyRender: true,
    extensions: createExtensions({ placeholder: "" }),
    content: "hello",
    contentType: "markdown",
  });
  useEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);
  if (!editor) return null;
  return (
    <>
      <TableBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}

async function mount() {
  let editor!: Editor;
  render(<Harness onReady={(e) => (editor = e)} />);
  await waitFor(() => expect(editor).toBeTruthy());
  return editor;
}

/** Seed a table and leave the caret in its first cell. */
function insertTable(editor: Editor, rows = 3, cols = 3) {
  act(() => {
    editor.chain().insertTable({ rows, cols, withHeaderRow: true }).run();
  });
}

const rowCount = (e: Editor) => (e.getHTML().match(/<tr>/g) ?? []).length;
const colCount = (e: Editor) =>
  ((e.getHTML().match(/<tr>(.*?)<\/tr>/)?.[1] ?? "").match(/<t[hd]/g) ?? []).length;

const control = (name: string) => screen.getByRole("button", { name });

describe("TableBubbleMenu visibility", () => {
  it("should stay out of the way when no table is being edited", async () => {
    await mount();

    expect(screen.queryByRole("button", { name: "editor.addRowAfter" })).toBeNull();
  });

  it("should appear once the caret is in a table", async () => {
    const editor = await mount();

    insertTable(editor);

    await waitFor(() => expect(control("editor.addRowAfter")).toBeTruthy());
  });

  it("should offer every action the toolbar menu had", async () => {
    // Including the two the report named: adding rows/columns, and deleting.
    const editor = await mount();
    insertTable(editor);
    await waitFor(() => expect(control("editor.addRowAfter")).toBeTruthy());

    for (const key of [
      "addRowBefore",
      "addRowAfter",
      "deleteRow",
      "addColumnBefore",
      "addColumnAfter",
      "deleteColumn",
      "deleteTable",
    ]) {
      expect(control(`editor.${key}`), key).toBeTruthy();
    }
  });

  it("should go away when the caret leaves the table", async () => {
    const editor = await mount();
    insertTable(editor);
    await waitFor(() => expect(control("editor.addRowAfter")).toBeTruthy());

    // Park the caret in a paragraph appended after the table. Asserting the
    // move landed outside first, so a setup that quietly kept the caret in a
    // cell fails here rather than looking like the menu refused to hide.
    act(() => {
      editor
        .chain()
        .insertContentAt(editor.state.doc.content.size, "<p>after</p>")
        .focus("end")
        .run();
    });
    expect(editor.isActive("table")).toBe(false);

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "editor.addRowAfter" })).toBeNull(),
    );
  });
});

describe("TableBubbleMenu actions", () => {
  it.each([
    ["addRowBefore", 1],
    ["addRowAfter", 1],
    ["deleteRow", -1],
  ])("should apply %s to the table", async (key, delta) => {
    const editor = await mount();
    insertTable(editor);
    await waitFor(() => expect(control(`editor.${key}`)).toBeTruthy());
    const before = rowCount(editor);

    fireEvent.click(control(`editor.${key}`));

    expect(rowCount(editor)).toBe(before + delta);
  });

  it.each([
    ["addColumnBefore", 1],
    ["addColumnAfter", 1],
    ["deleteColumn", -1],
  ])("should apply %s to the table", async (key, delta) => {
    const editor = await mount();
    insertTable(editor);
    await waitFor(() => expect(control(`editor.${key}`)).toBeTruthy());
    const before = colCount(editor);

    fireEvent.click(control(`editor.${key}`));

    expect(colCount(editor)).toBe(before + delta);
  });

  it("should delete the whole table and take the menu with it", async () => {
    const editor = await mount();
    insertTable(editor);
    await waitFor(() => expect(control("editor.deleteTable")).toBeTruthy());

    fireEvent.click(control("editor.deleteTable"));

    expect(editor.getHTML()).not.toContain("<table");
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "editor.deleteTable" })).toBeNull(),
    );
  });

  it("should label every control, since they are icons only", async () => {
    // Unlabelled icons in the toolbar are half of why the old route was
    // undiscoverable; an icon bar has to carry its names for pointer and
    // screen reader alike.
    const editor = await mount();
    insertTable(editor);
    await waitFor(() => expect(control("editor.addRowAfter")).toBeTruthy());

    expect(control("editor.addRowAfter").getAttribute("title")).toBe("editor.addRowAfter");
  });
});
