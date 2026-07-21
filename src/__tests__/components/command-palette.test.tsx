// @vitest-environment jsdom
//
// Regression: opening the search palette crashed with "Cannot read properties
// of undefined (reading 'subscribe')" — the Base UI port of shadcn's
// CommandDialog rendered its children without the cmdk <Command> root, so
// CommandInput/CommandList mounted with no store to subscribe to.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CommandPalette, type PaletteRow } from "@/components/terminal/CommandPalette";

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

const rows: PaletteRow[] = [
  { kind: "page", label: "~/posts", haystack: "posts", onSelect: () => {} },
  { kind: "content", label: "Two Sum", haystack: "two-sum leetcode", onSelect: () => {} },
];

describe("CommandPalette", () => {
  it("should render input and grouped rows when opened", () => {
    render(
      <CommandPalette open onOpenChange={() => {}} rows={rows} placeholder="type a command" />,
    );
    expect(screen.getByPlaceholderText("type a command")).toBeDefined();
    expect(screen.getByText("~/posts")).toBeDefined();
    expect(screen.getByText("Two Sum")).toBeDefined();
  });
});
