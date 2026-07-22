// @vitest-environment jsdom
//
// Editor link dialog (⌘K): URL mode links the selection verbatim; search mode
// queries posts + notes by title only after typing (never mid-IME-composition)
// and inserts the picked article as an internal link.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Editor } from "@tiptap/react";
import { createExtensions } from "@/components/admin/editor/extensions";
import { LinkDialog, isUrlLike } from "@/components/admin/editor/LinkDialog";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

const searchLinkTargetsFn = vi.fn();
vi.mock("@/server/admin/reads", () => ({
  searchLinkTargetsFn: (arg: unknown) => searchLinkTargetsFn(arg),
}));

afterEach(() => {
  cleanup();
  searchLinkTargetsFn.mockReset();
});

function makeEditor(content = ""): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: createExtensions({ placeholder: "" }),
    content,
    contentType: "markdown",
  });
}

describe("isUrlLike", () => {
  it("accepts absolute, relative, anchor and mailto values", () => {
    expect(isUrlLike("https://example.com")).toBe(true);
    expect(isUrlLike("/posts/hello")).toBe(true);
    expect(isUrlLike("#section")).toBe(true);
    expect(isUrlLike("mailto:a@b.c")).toBe(true);
    expect(isUrlLike("gas station")).toBe(false);
  });
});

describe("LinkDialog", () => {
  it("applies a pasted URL to the selected text", () => {
    const editor = makeEditor("hello world");
    // Select "hello" (doc starts at pos 1).
    editor.commands.setTextSelection({ from: 1, to: 6 });

    render(<LinkDialog editor={editor} open onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText("editor.linkDialogPlaceholder");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(editor.getMarkdown()).toBe("[hello](https://example.com) world");
  });

  it("searches by title and inserts the picked article as a link", async () => {
    searchLinkTargetsFn.mockResolvedValue([
      {
        type: "note",
        title: "134. Gas Station",
        url: "/interview/coding/134-gas-station",
        status: "published",
        context: "coding",
      },
    ]);
    const editor = makeEditor("");

    render(<LinkDialog editor={editor} open onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText("editor.linkDialogPlaceholder");
    fireEvent.change(input, { target: { value: "gas" } });

    await waitFor(() => expect(searchLinkTargetsFn).toHaveBeenCalledWith({ data: { q: "gas" } }));
    const row = await screen.findByText("134. Gas Station");
    fireEvent.click(row);

    expect(editor.getMarkdown()).toBe("[134. Gas Station](/interview/coding/134-gas-station)");
  });

  it("does not search while an IME composition is in flight", async () => {
    const editor = makeEditor("");
    render(<LinkDialog editor={editor} open onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText("editor.linkDialogPlaceholder");

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "ㄍ" } });
    await new Promise((r) => setTimeout(r, 350));
    expect(searchLinkTargetsFn).not.toHaveBeenCalled();

    searchLinkTargetsFn.mockResolvedValue([]);
    fireEvent.change(input, { target: { value: "貪心" } });
    fireEvent.compositionEnd(input);
    await waitFor(() => expect(searchLinkTargetsFn).toHaveBeenCalledWith({ data: { q: "貪心" } }));
  });
});
