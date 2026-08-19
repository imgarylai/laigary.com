// @vitest-environment happy-dom
//
// The `/` block-insert menu (#173).
import { describe, expect, it, vi } from "vitest";
import { Editor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";
import { SLASH_ITEMS, filterSlashItems } from "@/components/admin/editor/slash-suggestion";
import en from "@/i18n/locales/en.json";
import zhTW from "@/i18n/locales/zh-TW.json";

function makeEditor(content = "", dialogs?: { openImage: () => void; openYouTube: () => void }) {
  return new Editor({
    element: document.createElement("div"),
    extensions: createExtensions({ placeholder: "", dialogs }),
    content,
    contentType: "markdown",
  });
}

/** Run an item the way the suggestion plugin does: over the typed `/query`. */
function runItem(
  editor: Editor,
  key: string,
  dialogs = { openImage: () => {}, openYouTube: () => {} },
) {
  const item = SLASH_ITEMS.find((i) => i.key === key);
  if (!item) throw new Error(`no slash item ${key}`);
  const { from, to } = editor.state.selection;
  item.run(editor, { from, to }, dialogs);
}

describe("filterSlashItems", () => {
  it("should offer every block when nothing has been typed yet", () => {
    expect(filterSlashItems("")).toHaveLength(SLASH_ITEMS.length);
  });

  it("should match on the item key so /code finds the code block", () => {
    expect(filterSlashItems("code").map((i) => i.key)).toContain("codeBlock");
  });

  it("should match on keywords so a synonym finds the block", () => {
    // "todo" is not in the key, only in the keywords.
    expect(filterSlashItems("todo").map((i) => i.key)).toEqual(["taskList"]);
    expect(filterSlashItems("divider").map((i) => i.key)).toEqual(["horizontalRule"]);
  });

  it("should ignore case so a capitalised query still matches", () => {
    expect(filterSlashItems("TABLE").map((i) => i.key)).toEqual(["table"]);
  });

  it("should return nothing when the query matches no block", () => {
    // The menu renders nothing rather than an empty box.
    expect(filterSlashItems("zzzz")).toHaveLength(0);
  });
});

describe("slash items", () => {
  it("should insert an untagged code block so the card's picker sets the language", () => {
    const editor = makeEditor();

    runItem(editor, "codeBlock");

    expect(editor.isActive("codeBlock")).toBe(true);
    let language: string | null = "unset";
    editor.state.doc.descendants((node) => {
      if (node.type.name === "codeBlock") language = node.attrs.language;
    });
    expect(language).toBe(null);
    editor.destroy();
  });

  it("should insert a table with a header row", () => {
    const editor = makeEditor();

    runItem(editor, "table");

    expect(editor.isActive("table")).toBe(true);
    editor.destroy();
  });

  it("should apply block types that toggle existing text", () => {
    const editor = makeEditor();

    runItem(editor, "blockquote");

    expect(editor.isActive("blockquote")).toBe(true);
    editor.destroy();
  });

  it("should open the image dialog rather than inserting a node directly", () => {
    // Uploading needs a dialog, so the item's job is to get out of the way.
    const openImage = vi.fn();
    const editor = makeEditor();

    runItem(editor, "image", { openImage, openYouTube: () => {} });

    expect(openImage).toHaveBeenCalled();
    editor.destroy();
  });

  it("should open the youtube dialog rather than inserting a node directly", () => {
    const openYouTube = vi.fn();
    const editor = makeEditor();

    runItem(editor, "youtube", { openImage: () => {}, openYouTube });

    expect(openYouTube).toHaveBeenCalled();
    editor.destroy();
  });

  it("should do something to the document for every item that is not a dialog", () => {
    // Covers each item's `run` rather than a hand-picked few: an entry that
    // silently did nothing would look identical in the menu.
    const dialogBacked = new Set(["image", "youtube"]);

    for (const item of SLASH_ITEMS.filter((i) => !dialogBacked.has(i.key))) {
      const editor = makeEditor();
      const before = JSON.stringify(editor.getJSON());

      runItem(editor, item.key);

      expect(JSON.stringify(editor.getJSON()), `${item.key} changed nothing`).not.toBe(before);
      editor.destroy();
    }
  });

  it("should reach a dialog for every item that needs one", () => {
    const dialogBacked = ["image", "youtube"] as const;

    for (const key of dialogBacked) {
      const openImage = vi.fn();
      const openYouTube = vi.fn();
      const editor = makeEditor();

      runItem(editor, key, { openImage, openYouTube });

      const opened = key === "image" ? openImage : openYouTube;
      expect(opened, `${key} opened no dialog`).toHaveBeenCalled();
      editor.destroy();
    }
  });

  it("should have a translated label in both locales for every item", () => {
    // A missing key renders as the raw key string in the menu.
    for (const item of SLASH_ITEMS) {
      expect(en.editor.slash, `en is missing ${item.key}`).toHaveProperty(item.key);
      expect(zhTW.editor.slash, `zh-TW is missing ${item.key}`).toHaveProperty(item.key);
    }
  });

  it("should give every item a distinct key so the menu cannot render duplicates", () => {
    const keys = SLASH_ITEMS.map((i) => i.key);

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("slash trigger", () => {
  it("should register the suggestion plugin so `/` is watched", () => {
    const editor = makeEditor();

    const hasPlugin = editor.state.plugins.some((plugin) =>
      (plugin as { key?: string }).key?.startsWith("slashSuggestion"),
    );

    expect(hasPlugin).toBe(true);
    editor.destroy();
  });
});
