// @vitest-environment jsdom
//
// Covers the ⌘K palette contract: pages are pre-loaded (rendered immediately);
// content rows are fetched on demand only after the user types, and (for IME
// input) only once the composition commits — never mid-composition.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { CommandPalette, type PaletteRow } from "@/features/terminal/CommandPalette";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

// cmdk observes its list element for size changes; jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
// cmdk scrolls the selected item into view; jsdom elements lack the method.
Element.prototype.scrollIntoView = () => {};

afterEach(cleanup);

const pages: PaletteRow[] = [
  { kind: "page", label: "ls ~", haystack: "home", onSelect: () => {} },
  { kind: "page", label: "cd ./posts", haystack: "posts archive", onSelect: () => {} },
];

const contentRow: PaletteRow = {
  kind: "content",
  label: "cat two-sum",
  sub: "Two Sum",
  haystack: "two sum leetcode",
  onSelect: () => {},
};

describe("CommandPalette", () => {
  it("pre-loads page rows without any search", () => {
    const searchContent = vi.fn(async () => [contentRow]);
    render(
      <CommandPalette
        open
        onOpenChange={() => {}}
        pages={pages}
        searchContent={searchContent}
        placeholder="type a command"
      />,
    );
    expect(screen.getByPlaceholderText("type a command")).toBeDefined();
    expect(screen.getByText("ls ~")).toBeDefined();
    expect(screen.getByText("cd ./posts")).toBeDefined();
    // Content is NOT fetched until the user types.
    expect(searchContent).not.toHaveBeenCalled();
    expect(screen.queryByText("Two Sum")).toBeNull();
  });

  it("searches content on demand after typing", async () => {
    const searchContent = vi.fn(async () => [contentRow]);
    render(
      <CommandPalette
        open
        onOpenChange={() => {}}
        pages={pages}
        searchContent={searchContent}
        placeholder="search"
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("search"), { target: { value: "two" } });
    await waitFor(() => expect(searchContent).toHaveBeenCalledWith("two"));
    expect(await screen.findByText("Two Sum")).toBeDefined();
  });

  it("does not search while an IME composition is in flight", async () => {
    const searchContent = vi.fn(async () => [contentRow]);
    render(
      <CommandPalette
        open
        onOpenChange={() => {}}
        pages={pages}
        searchContent={searchContent}
        placeholder="search"
      />,
    );
    const input = screen.getByPlaceholderText("search") as HTMLInputElement;

    // Simulate typing Zhuyin/Pinyin: composition starts, the input carries the
    // half-formed value, but no search fires until the composition commits.
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "ㄊ" } });
    // Give the debounce window a chance — it must stay gated while composing.
    await new Promise((r) => setTimeout(r, 250));
    expect(searchContent).not.toHaveBeenCalled();

    // Composition commits to a real word → the search now fires with it.
    fireEvent.change(input, { target: { value: "貪心" } });
    fireEvent.compositionEnd(input);
    await waitFor(() => expect(searchContent).toHaveBeenCalledWith("貪心"));
  });
});

describe("CommandPalette lifecycle branches", () => {
  it("resets query and content when the dialog closes", async () => {
    const searchContent = vi.fn(async () => [contentRow]);
    const { rerender } = render(
      <CommandPalette
        open
        onOpenChange={() => {}}
        pages={pages}
        searchContent={searchContent}
        placeholder="search"
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("search"), { target: { value: "two" } });
    expect(await screen.findByText("Two Sum")).toBeDefined();

    rerender(
      <CommandPalette
        open={false}
        onOpenChange={() => {}}
        pages={pages}
        searchContent={searchContent}
        placeholder="search"
      />,
    );
    rerender(
      <CommandPalette
        open
        onOpenChange={() => {}}
        pages={pages}
        searchContent={searchContent}
        placeholder="search"
      />,
    );
    const input = screen.getByPlaceholderText("search") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(screen.queryByText("Two Sum")).toBeNull();
  });

  it("shows no matches when the content search fails", async () => {
    const searchContent = vi.fn(async () => {
      throw new Error("boom");
    });
    render(
      <CommandPalette
        open
        onOpenChange={() => {}}
        pages={[]}
        searchContent={searchContent}
        placeholder="search"
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("search"), { target: { value: "zzz" } });
    expect(await screen.findByText("blog.search.noMatches")).toBeDefined();
  });
});
