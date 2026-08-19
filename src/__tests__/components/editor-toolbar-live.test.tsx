// @vitest-environment jsdom
//
// Stays on jsdom: the caret-colour swatch is read through computed styles,
// which happy-dom resolves differently. Everything else in the suite runs on
// happy-dom; see vitest.config.ts.
//
// The toolbar is memoised and subscribes to the editor itself (#175). Before
// that it read `editor.isActive(...)` during render and was only ever correct
// because the document flowed through React state, re-rendering the whole
// editor on every keystroke. These tests hold the parent still — it renders
// once and never again — so anything that still depends on an ancestor
// re-rendering shows up as a frozen control rather than as a passing test.

import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";
import { Toolbar } from "@/components/admin/editor/Toolbar";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

afterEach(cleanup);

/**
 * Mounts the toolbar over a real editor and counts how many times the parent
 * renders, so a test can prove the toolbar updated on its own.
 */
function Harness({
  onReady,
  renders,
  onOpenLink = () => {},
  sourceMode = false,
  onToggleSource = () => {},
}: {
  onReady: (editor: Editor) => void;
  renders: number[];
  onOpenLink?: () => void;
  sourceMode?: boolean;
  onToggleSource?: () => void;
}) {
  const editor = useEditor({
    immediatelyRender: true,
    extensions: createExtensions({ placeholder: "" }),
    content: "hello world",
    contentType: "markdown",
  });
  renders.push(1);
  useEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);
  if (!editor) return null;
  return (
    <>
      <Toolbar
        editor={editor}
        onOpenLink={onOpenLink}
        sourceMode={sourceMode}
        onToggleSource={onToggleSource}
      />
      <EditorContent editor={editor} />
    </>
  );
}

async function mountToolbar() {
  const renders: number[] = [];
  let editor!: Editor;
  render(<Harness renders={renders} onReady={(e) => (editor = e)} />);
  await waitFor(() => expect(editor).toBeTruthy());
  return { editor, renders };
}

const button = (name: string) => screen.getByRole("button", { name });

describe("Toolbar", () => {
  it("should reflect a mark applied outside React without the parent re-rendering", async () => {
    const { editor, renders } = await mountToolbar();
    const before = renders.length;
    expect(button("editor.bold").getAttribute("aria-pressed")).toBe("false");

    // Straight at the editor: nothing above the toolbar changes state, so the
    // only way this can show up is the toolbar's own subscription.
    act(() => {
      editor.chain().selectAll().toggleBold().run();
    });

    expect(button("editor.bold").getAttribute("aria-pressed")).toBe("true");
    expect(renders.length).toBe(before);
  });

  it("should turn a mark's button back off when the mark is removed", async () => {
    const { editor } = await mountToolbar();
    act(() => {
      editor.chain().selectAll().toggleItalic().run();
    });
    expect(button("editor.italic").getAttribute("aria-pressed")).toBe("true");

    act(() => {
      editor.chain().selectAll().toggleItalic().run();
    });

    expect(button("editor.italic").getAttribute("aria-pressed")).toBe("false");
  });

  it("should track several marks independently", async () => {
    const { editor } = await mountToolbar();

    act(() => {
      // Not `code`: that mark excludes every other, so it would strip the bold
      // again and the test would be asserting ProseMirror's schema, not ours.
      editor.chain().selectAll().toggleBold().toggleUnderline().run();
    });

    expect(button("editor.bold").getAttribute("aria-pressed")).toBe("true");
    expect(button("editor.underline").getAttribute("aria-pressed")).toBe("true");
    // A shared selector must not light up flags nobody asked for.
    expect(button("editor.italic").getAttribute("aria-pressed")).toBe("false");
    expect(button("editor.bulletList").getAttribute("aria-pressed")).toBe("false");
  });

  it("should leave the non-toggling slash hint without a pressed state", async () => {
    await mountToolbar();

    expect(button("editor.slashHint").hasAttribute("aria-pressed")).toBe(false);
  });

  it("should let the table menu notice the caret entering a table", async () => {
    // The table menu subscribes separately from the toolbar's own selector, so
    // it needs its own proof: with the toolbar memoised, a menu that read the
    // editor during render would be stuck on whatever was true at mount.
    const { editor } = await mountToolbar();
    fireEvent.click(button("editor.table"));
    expect(
      (await screen.findByRole("menuitem", { name: "editor.insertTable" })).hasAttribute(
        "disabled",
      ),
    ).toBe(false);
    fireEvent.keyDown(document.body, { key: "Escape" });

    act(() => {
      editor.chain().insertTable({ rows: 2, cols: 2 }).run();
    });

    fireEvent.click(button("editor.table"));
    // Inside a table, inserting another is off and editing rows is on.
    await waitFor(() =>
      expect(
        screen.getByRole("menuitem", { name: "editor.insertTable" }).getAttribute("data-disabled"),
      ).toBe(""),
    );
    expect(
      screen.getByRole("menuitem", { name: "editor.deleteRow" }).hasAttribute("data-disabled"),
    ).toBe(false);
  });

  it("should show the colour at the caret in the palette swatch", async () => {
    const { editor } = await mountToolbar();
    const swatch = () => button("editor.textColor").querySelector("div > div") as HTMLElement;
    expect(swatch().style.backgroundColor).toBe("currentcolor");

    act(() => {
      editor.chain().selectAll().setColor("#2563eb").run();
    });

    expect(swatch().style.backgroundColor).toBe("rgb(37, 99, 235)");
  });
});

describe("Toolbar commands", () => {
  // The buttons are the other half of the contract: they have to run the
  // command they advertise, and the flag they paint has to agree afterwards.
  it.each([
    ["editor.bold", "bold"],
    ["editor.italic", "italic"],
    ["editor.underline", "underline"],
    ["editor.highlight", "highlight"],
    ["editor.subscript", "subscript"],
    ["editor.superscript", "superscript"],
    ["editor.inlineCode", "code"],
  ])("should apply %s to the selection", async (label, mark) => {
    const { editor } = await mountToolbar();
    act(() => {
      editor.chain().selectAll().run();
    });

    fireEvent.click(button(label));

    expect(editor.isActive(mark)).toBe(true);
    expect(button(label).getAttribute("aria-pressed")).toBe("true");
  });

  it.each([
    ["editor.heading1", 1],
    ["editor.heading2", 2],
  ])("should turn the block into %s", async (label, level) => {
    const { editor } = await mountToolbar();

    fireEvent.click(button(label));

    expect(editor.isActive("heading", { level })).toBe(true);
    expect(button(label).getAttribute("aria-pressed")).toBe("true");
  });

  it.each([
    ["editor.bulletList", "bulletList"],
    ["editor.orderedList", "orderedList"],
  ])("should turn the block into %s", async (label, type) => {
    const { editor } = await mountToolbar();

    fireEvent.click(button(label));

    expect(editor.isActive(type)).toBe(true);
  });

  it("should open the link dialog rather than toggling a mark itself", async () => {
    // The link flow needs a URL, so the button is a door to the dialog — the
    // one toolbar button that does not run an editor command.
    const onOpenLink = vi.fn();
    let editor!: Editor;
    render(<Harness renders={[]} onReady={(e) => (editor = e)} onOpenLink={onOpenLink} />);
    await waitFor(() => expect(editor).toBeTruthy());

    // Named "editor.link (⌘K)" — the shortcut is part of the button's title.
    fireEvent.click(screen.getByRole("button", { name: /^editor\.link/ }));

    expect(onOpenLink).toHaveBeenCalled();
    expect(editor.isActive("link")).toBe(false);
  });

  it("should ask for the source pane rather than touching the document", async () => {
    // The one button here that is not an editor command: it flips a mode the
    // editor shell owns, and it must not write to the document on the way.
    const onToggleSource = vi.fn();
    let editor!: Editor;
    render(<Harness renders={[]} onReady={(e) => (editor = e)} onToggleSource={onToggleSource} />);
    await waitFor(() => expect(editor).toBeTruthy());
    const before = editor.getText();

    fireEvent.click(button("editor.viewSource"));

    expect(onToggleSource).toHaveBeenCalled();
    expect(editor.getText()).toBe(before);
  });

  it("should stay reachable while the rest of the toolbar is inert", async () => {
    // Source mode is read-only, so the writing controls go inert — but the
    // button that gets back out cannot be inside that group, or the mode would
    // be a one-way door.
    const renders: number[] = [];
    let editor!: Editor;
    render(<Harness renders={renders} onReady={(e) => (editor = e)} sourceMode />);
    await waitFor(() => expect(editor).toBeTruthy());

    expect(button("editor.bold").closest("[inert]")).toBeTruthy();
    expect(button("editor.viewSource").closest("[inert]")).toBeNull();
    expect(button("editor.viewSource").getAttribute("aria-pressed")).toBe("true");
  });

  it("should type a slash for the block menu", async () => {
    // Discoverability: the `/` menu is faster than any icon, but nothing on
    // screen would otherwise say it exists.
    const { editor } = await mountToolbar();

    fireEvent.click(button("editor.slashHint"));

    expect(editor.getText()).toContain("/");
  });

  it.each(["editor.alignLeft", "editor.alignCenter", "editor.alignRight"])(
    "should apply %s from the alignment menu",
    async (item) => {
      const { editor } = await mountToolbar();
      // The trigger is titled with the left-align label; the menu holds all three.
      fireEvent.click(button("editor.alignLeft"));

      fireEvent.click(await screen.findByRole("menuitem", { name: item }));

      expect(editor.isActive({ textAlign: item.replace("editor.align", "").toLowerCase() })).toBe(
        true,
      );
    },
  );

  it("should set and clear a text colour", async () => {
    const { editor } = await mountToolbar();
    act(() => {
      editor.chain().selectAll().run();
    });
    fireEvent.click(button("editor.textColor"));

    fireEvent.click(await screen.findByTitle("#2563eb"));
    expect(editor.getAttributes("textStyle").color).toBe("#2563eb");

    fireEvent.click(screen.getByRole("button", { name: "editor.clearColor" }));
    expect(editor.getAttributes("textStyle").color).toBeUndefined();
  });

  it("should insert a table from the menu", async () => {
    const { editor } = await mountToolbar();
    fireEvent.click(button("editor.table"));

    fireEvent.click(await screen.findByRole("menuitem", { name: "editor.insertTable" }));

    expect(editor.isActive("table")).toBe(true);
  });

  // Deliberately not chained onto the test above. Driving two menu items in a
  // row was order-dependent: closing the first menu does not reliably leave the
  // editor selection back inside the table, so the second command would find no
  // table to act on and the count would silently not move. Seeding the table
  // through the command puts the caret in a known cell.
  const rowCount = (e: Editor) => (e.getHTML().match(/<tr>/g) ?? []).length;
  const colCount = (e: Editor) =>
    ((e.getHTML().match(/<tr>(.*?)<\/tr>/)?.[1] ?? "").match(/<t[hd]/g) ?? []).length;

  it.each([
    ["editor.addRowBefore", 1],
    ["editor.addRowAfter", 1],
    ["editor.deleteRow", -1],
  ])("should apply %s to the table the caret is in", async (item, delta) => {
    const { editor } = await mountToolbar();
    act(() => {
      editor.chain().insertTable({ rows: 3, cols: 2 }).run();
    });
    const before = rowCount(editor);

    fireEvent.click(button("editor.table"));
    fireEvent.click(await screen.findByRole("menuitem", { name: item }));

    expect(rowCount(editor)).toBe(before + delta);
  });

  it.each([
    ["editor.addColumnBefore", 1],
    ["editor.addColumnAfter", 1],
    ["editor.deleteColumn", -1],
  ])("should apply %s to the table the caret is in", async (item, delta) => {
    const { editor } = await mountToolbar();
    act(() => {
      editor.chain().insertTable({ rows: 2, cols: 3 }).run();
    });
    const before = colCount(editor);

    fireEvent.click(button("editor.table"));
    fireEvent.click(await screen.findByRole("menuitem", { name: item }));

    expect(colCount(editor)).toBe(before + delta);
  });

  it("should delete the whole table", async () => {
    const { editor } = await mountToolbar();
    act(() => {
      editor.chain().insertTable({ rows: 2, cols: 2 }).run();
    });

    fireEvent.click(button("editor.table"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "editor.deleteTable" }));

    expect(editor.isActive("table")).toBe(false);
    expect(editor.getHTML()).not.toContain("<table");
  });
});

describe("editor chrome memoisation", () => {
  // A tripwire, not a behaviour test. Unwrapping any of these memos leaves
  // every test above passing — the subscriptions would still be correct — while
  // quietly restoring the per-keystroke rebuild of the whole editor chrome that
  // #175 was about. There is no user-visible signal for that, so assert it here.
  it.each([
    ["Toolbar", () => import("@/components/admin/editor/Toolbar").then((m) => m.Toolbar)],
    [
      "ToolbarTableMenu",
      () => import("@/components/admin/editor/ToolbarTableMenu").then((m) => m.ToolbarTableMenu),
    ],
    [
      "ColorPickerPopover",
      () =>
        import("@/components/admin/editor/ColorPickerPopover").then((m) => m.ColorPickerPopover),
    ],
    ["LinkDialog", () => import("@/components/admin/editor/LinkDialog").then((m) => m.LinkDialog)],
    [
      "ImageUploadDialog",
      () => import("@/components/admin/editor/ImageUploadDialog").then((m) => m.ImageUploadDialog),
    ],
    [
      "YouTubeDialog",
      () => import("@/components/admin/editor/YouTubeDialog").then((m) => m.YouTubeDialog),
    ],
  ])("should keep %s memoised", async (_name, load) => {
    expect((await load()).$$typeof).toBe(Symbol.for("react.memo"));
  });
});
