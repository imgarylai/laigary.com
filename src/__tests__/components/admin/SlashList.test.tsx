// @vitest-environment happy-dom
//
// The `/` menu's list component: what it renders and how it answers the keys
// the suggestion plugin hands it (#173).

import { createRef } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import {
  SLASH_ITEMS,
  SlashList,
  type SlashListHandle,
} from "@/components/admin/editor/slash-suggestion";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

const codeBlock = SLASH_ITEMS.find((i) => i.key === "codeBlock")!;
const table = SLASH_ITEMS.find((i) => i.key === "table")!;

function renderList(items = [codeBlock, table]) {
  const command = vi.fn();
  const ref = createRef<SlashListHandle>();
  render(<SlashList ref={ref} items={items} command={command} />);
  return { command, ref };
}

// act(), because arrow keys move the highlight through React state: without
// flushing, the next key would read a stale `active` from the handler closure.
function press(ref: React.RefObject<SlashListHandle | null>, key: string): boolean {
  let handled = false;
  act(() => {
    handled = ref.current!.onKeyDown(new KeyboardEvent("keydown", { key }));
  });
  return handled;
}

describe("SlashList", () => {
  it("should render a translated label for each offered block", () => {
    renderList();

    expect(screen.getByText("editor.slash.codeBlock")).toBeTruthy();
    expect(screen.getByText("editor.slash.table")).toBeTruthy();
  });

  it("should render nothing when no block matches so no empty box appears", () => {
    const { container } = render(<SlashList items={[]} command={vi.fn()} />);

    expect(container.firstChild).toBe(null);
  });

  it("should run the clicked block", () => {
    const { command } = renderList();

    fireEvent.click(screen.getByText("editor.slash.table"));

    expect(command).toHaveBeenCalledWith(table);
  });

  it("should run the highlighted block on Enter, starting from the first", () => {
    const { command, ref } = renderList();

    expect(press(ref, "Enter")).toBe(true);

    expect(command).toHaveBeenCalledWith(codeBlock);
  });

  it("should move the highlight down before running on Enter", () => {
    const { command, ref } = renderList();

    expect(press(ref, "ArrowDown")).toBe(true);
    press(ref, "Enter");

    expect(command).toHaveBeenCalledWith(table);
  });

  it("should wrap around the ends so the list is navigable in one direction", () => {
    const { command, ref } = renderList();

    // Up from the first entry lands on the last.
    expect(press(ref, "ArrowUp")).toBe(true);
    press(ref, "Enter");

    expect(command).toHaveBeenCalledWith(table);
  });

  it("should leave keys it does not use to the editor", () => {
    const { ref } = renderList();

    expect(press(ref, "a")).toBe(false);
    expect(press(ref, "Escape")).toBe(false);
  });

  it("should decline Enter when there is nothing to run", () => {
    // Returning false lets the editor treat Enter normally.
    const { command, ref } = renderList([]);

    expect(press(ref, "Enter")).toBe(false);
    expect(command).not.toHaveBeenCalled();
  });

  it("should highlight the block the pointer moves onto", () => {
    const { command, ref } = renderList();

    act(() => {
      fireEvent.mouseEnter(screen.getByText("editor.slash.table"));
    });
    press(ref, "Enter");

    expect(command).toHaveBeenCalledWith(table);
  });
});

describe("SlashList sizing", () => {
  // Eleven items came to 419px with `overflow: hidden`, which on a laptop ran
  // off the screen and could not even be scrolled to (#196).
  it("should bound its height rather than run off the screen", () => {
    const { container } = render(
      <SlashList ref={createRef<SlashListHandle>()} items={SLASH_ITEMS} command={vi.fn()} />,
    );

    const list = container.firstElementChild!;
    expect(list.className).toContain("max-h-");
    expect(list.className).toContain("overflow-y-auto");
  });

  it("should not clip the overflow away", () => {
    // `overflow: hidden` is what made the tail of the list unreachable rather
    // than merely off-screen.
    const { container } = render(
      <SlashList ref={createRef<SlashListHandle>()} items={SLASH_ITEMS} command={vi.fn()} />,
    );

    expect(container.firstElementChild!.className).not.toContain("overflow-hidden");
  });

  it("should keep the highlighted item in view while arrowing", () => {
    // Once the list scrolls, the highlight can walk off the visible window.
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const ref = createRef<SlashListHandle>();
    render(<SlashList ref={ref} items={SLASH_ITEMS} command={vi.fn()} />);
    scrollIntoView.mockClear();

    press(ref, "ArrowDown");

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("should carry no z-index of its own", () => {
    // This element is position: static, where z-index does nothing. Putting one
    // here is what hid the bug: the stacking has to go on the element
    // floating-ui positions, and a no-op class here only looks like it works.
    const { container } = render(
      <SlashList ref={createRef<SlashListHandle>()} items={SLASH_ITEMS} command={vi.fn()} />,
    );

    expect(container.firstElementChild!.className).not.toMatch(/(^|\s)z-\d/);
  });
});
