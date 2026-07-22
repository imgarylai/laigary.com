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

const targets = [
  {
    type: "note",
    title: "134. Gas Station",
    url: "/interview/coding/134-gas-station",
    status: "published",
    context: "coding",
  },
  {
    type: "post",
    title: "Gas prices",
    url: "/posts/gas-prices",
    status: "draft",
    context: "post",
  },
];

describe("LinkDialog interaction branches", () => {
  it("navigates results with arrows and picks the active one with Enter", async () => {
    searchLinkTargetsFn.mockResolvedValue(targets);
    const editor = makeEditor("");
    render(<LinkDialog editor={editor} open onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText("editor.linkDialogPlaceholder");
    fireEvent.change(input, { target: { value: "gas" } });
    await screen.findByText("134. Gas Station");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(editor.getMarkdown()).toBe("[Gas prices](/posts/gas-prices)");
  });

  it("applies the URL by clicking the url-mode row", () => {
    const editor = makeEditor("hi");
    editor.commands.setTextSelection({ from: 1, to: 3 });
    render(<LinkDialog editor={editor} open onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText("editor.linkDialogPlaceholder");
    fireEvent.change(input, { target: { value: "/posts/hello" } });
    fireEvent.click(screen.getByText("/posts/hello"));
    expect(editor.getMarkdown()).toBe("[hi](/posts/hello)");
  });

  it("moves the active row on hover", async () => {
    searchLinkTargetsFn.mockResolvedValue(targets);
    const editor = makeEditor("");
    render(<LinkDialog editor={editor} open onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText("editor.linkDialogPlaceholder");
    fireEvent.change(input, { target: { value: "gas" } });
    const second = await screen.findByText("Gas prices");

    fireEvent.mouseEnter(second.closest("button")!);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(editor.getMarkdown()).toBe("[Gas prices](/posts/gas-prices)");
  });

  it("prefills an existing link's href and can remove the link", () => {
    const editor = makeEditor("[hello](https://old.example) world");
    // Put the caret inside the linked text.
    editor.commands.setTextSelection(3);
    const onOpenChange = vi.fn();
    render(<LinkDialog editor={editor} open onOpenChange={onOpenChange} />);

    const input = screen.getByPlaceholderText("editor.linkDialogPlaceholder") as HTMLInputElement;
    expect(input.value).toBe("https://old.example");

    fireEvent.click(screen.getByText("editor.linkRemove"));
    expect(editor.getMarkdown()).toBe("hello world");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("edits an existing link across its whole mark range", () => {
    const editor = makeEditor("[hello](https://old.example) world");
    editor.commands.setTextSelection(3);
    render(<LinkDialog editor={editor} open onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText("editor.linkDialogPlaceholder");
    fireEvent.change(input, { target: { value: "https://new.example" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(editor.getMarkdown()).toBe("[hello](https://new.example) world");
  });

  it("shows no matches when the search fails", async () => {
    searchLinkTargetsFn.mockRejectedValue(new Error("boom"));
    const editor = makeEditor("");
    render(<LinkDialog editor={editor} open onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText("editor.linkDialogPlaceholder");
    fireEvent.change(input, { target: { value: "gas" } });
    expect(await screen.findByText("editor.linkNoResults")).toBeDefined();
  });
});
