// @vitest-environment jsdom
//
// Covers the ⌘K palette contract: pages are pre-loaded (rendered immediately);
// content rows are fetched on demand only after the user types, and (for IME
// input) only once the composition commits — never mid-composition.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
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

// Comfortably past CommandPalette's 180ms query debounce.
const PAST_DEBOUNCE = 400;

/**
 * Type a query and drive the debounce with fake timers rather than waiting on
 * the wall clock. How many renders land inside a real 180ms window varies with
 * runner load, and that showed up as per-run coverage drift in this file.
 *
 * Assert synchronously after this resolves — `advanceTimersByTimeAsync` flushes
 * the pending microtasks too, so the search has already settled. Never reach
 * for `findBy`/`waitFor` here: their polling deadlocks against fake timers.
 */
async function typeAndSettle(value: string) {
  vi.useFakeTimers();
  try {
    fireEvent.change(screen.getByPlaceholderText("search"), { target: { value } });
    await act(() => vi.advanceTimersByTimeAsync(PAST_DEBOUNCE));
  } finally {
    vi.useRealTimers();
  }
}

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
    await typeAndSettle("two");
    expect(searchContent).toHaveBeenCalledWith("two");
    expect(screen.getByText("Two Sum")).toBeDefined();
  });

  it("runs the row action and closes the dialog on select", async () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    const row: PaletteRow = {
      kind: "content",
      label: "cat two-sum",
      sub: "Two Sum",
      haystack: "two sum",
      onSelect,
    };
    const searchContent = vi.fn(async () => [row]);
    render(
      <CommandPalette
        open
        onOpenChange={onOpenChange}
        pages={[]}
        searchContent={searchContent}
        placeholder="search"
      />,
    );
    await typeAndSettle("two");
    fireEvent.click(screen.getByText("Two Sum"));
    expect(onSelect).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stacks the title over the path, and falls back to the path when a content row has no title", async () => {
    // A page row carrying a descriptor (its second, dimmed line) plus two
    // content rows — one with a title, one without — exercise every branch of
    // the stacked row: page vs content primary, and the title-missing fallback.
    const pagesWithSub: PaletteRow[] = [
      {
        kind: "page",
        label: "cd ./leetcode",
        sub: "leetcode",
        haystack: "leetcode",
        onSelect: () => {},
      },
    ];
    const rows: PaletteRow[] = [
      {
        kind: "content",
        label: "cat titled",
        sub: "Titled Note",
        haystack: "titled",
        onSelect: () => {},
      },
      { kind: "content", label: "cat untitled", haystack: "untitled", onSelect: () => {} },
    ];
    const searchContent = vi.fn(async () => rows);
    render(
      <CommandPalette
        open
        onOpenChange={() => {}}
        pages={pagesWithSub}
        searchContent={searchContent}
        placeholder="search"
      />,
    );
    // Page row shows both its command and its descriptor line.
    expect(screen.getByText("cd ./leetcode")).toBeDefined();
    expect(screen.getByText("leetcode")).toBeDefined();

    await typeAndSettle("t");
    // Content row with a title: title is the primary line, path the secondary.
    expect(screen.getByText("Titled Note")).toBeDefined();
    expect(screen.getByText("cat titled")).toBeDefined();
    // Content row with no title falls back to showing the path as the primary.
    expect(screen.getByText("cat untitled")).toBeDefined();
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
    // Fake timers so the debounce window elapses deterministically — two
    // changes inside one real window collapse into a single trailing search
    // whether or not the gate works, so a wall-clock sleep both slowed the test
    // and weakened it.
    vi.useFakeTimers();
    try {
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: "ㄊ" } });
      await act(() => vi.advanceTimersByTimeAsync(PAST_DEBOUNCE));
      expect(searchContent).not.toHaveBeenCalled();

      // Composition commits to a real word → the search now fires with it.
      fireEvent.change(input, { target: { value: "貪心" } });
      fireEvent.compositionEnd(input);
      await act(() => vi.advanceTimersByTimeAsync(PAST_DEBOUNCE));
      expect(searchContent).toHaveBeenCalledWith("貪心");
      // The half-formed syllable never reached the backend.
      expect(searchContent).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
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
    await typeAndSettle("two");
    expect(screen.getByText("Two Sum")).toBeDefined();

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
    await typeAndSettle("zzz");
    expect(screen.getByText("blog.search.noMatches")).toBeDefined();
  });
});
