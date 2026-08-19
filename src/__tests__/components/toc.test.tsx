// @vitest-environment happy-dom
//
// The post/note table of contents: one entry list rendered twice — a fixed
// gutter nav on wide screens and a toggleable drawer below xl.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Toc } from "@/features/terminal/Toc";
import type { TocEntry } from "@/lib/toc";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

// The component highlights via useActiveHeading; drive it directly instead of
// simulating scroll, which jsdom cannot do.
const activeId = vi.hoisted(() => ({ current: null as string | null }));
vi.mock("@/hooks/use-active-heading", () => ({
  useActiveHeading: () => activeId.current,
}));

// Writing the active section to the url needs a router; it is a side effect of
// the highlight rather than part of the list, and is covered by its own tests.
vi.mock("@/hooks/use-hash-sync", () => ({ useHashSync: () => {} }));

const ENTRIES: TocEntry[] = [
  { depth: 2, text: "三種基本型", id: "三種基本型" },
  { depth: 3, text: "Subsets 型", id: "subsets-型" },
  { depth: 2, text: "剪枝", id: "剪枝" },
];

beforeEach(() => {
  activeId.current = null;
});
afterEach(cleanup);

// Both presentations render the same list. While the drawer is hidden it is
// correctly invisible to role queries, so list semantics are asserted against
// the always-present gutter nav.
const gutterNav = () => screen.getByRole("navigation", { name: "blog.post.toc" });
const drawer = () => document.getElementById("tm-toc-drawer")!;
const toggle = () => screen.getByRole("button", { name: "blog.post.tocToggle" });

describe("Toc", () => {
  it("should render nothing when the page has fewer than two headings", () => {
    const { container } = render(<Toc entries={[ENTRIES[0]]} />);
    expect(container.innerHTML).toBe("");
  });

  it("should render nothing when the page has no headings at all", () => {
    const { container } = render(<Toc entries={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("should link each entry to its heading anchor when given entries", () => {
    render(<Toc entries={ENTRIES} />);
    const links = within(gutterNav()).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["三種基本型", "Subsets 型", "剪枝"]);
    // CJK ids have to be percent-encoded to form a valid href.
    expect(links[0].getAttribute("href")).toBe(`#${encodeURIComponent("三種基本型")}`);
  });

  it("should indent h3 entries deeper than h2 entries", () => {
    render(<Toc entries={ENTRIES} />);
    const [h2, h3] = within(gutterNav()).getAllByRole("link");
    expect(h3.className).toContain("pl-5");
    expect(h2.className).not.toContain("pl-5");
  });

  it("should mark the active entry as current when a heading is in view", () => {
    activeId.current = "剪枝";
    render(<Toc entries={ENTRIES} />);
    const current = within(gutterNav()).getByRole("link", { current: "location" });
    expect(current.textContent).toBe("剪枝");
  });

  it("should keep the drawer hidden until the toggle is pressed", () => {
    render(<Toc entries={ENTRIES} />);
    expect(drawer().hasAttribute("hidden")).toBe(true);

    fireEvent.click(toggle());
    expect(drawer().hasAttribute("hidden")).toBe(false);
  });

  it("should close the drawer when an entry is selected", () => {
    render(<Toc entries={ENTRIES} />);
    fireEvent.click(toggle());

    fireEvent.click(within(drawer()).getAllByRole("link")[0]);
    expect(drawer().hasAttribute("hidden")).toBe(true);
  });

  it("should close the drawer when the backdrop is clicked", () => {
    render(<Toc entries={ENTRIES} />);
    fireEvent.click(toggle());

    // The backdrop is aria-hidden and unfocusable — it exists only to catch
    // the dismissing click, so it is reachable by class rather than by role.
    const backdrop = document.querySelector(".fixed.inset-0")!;
    fireEvent.click(backdrop);
    expect(drawer().hasAttribute("hidden")).toBe(true);
  });

  it("should close the drawer when escape is pressed", () => {
    render(<Toc entries={ENTRIES} />);
    fireEvent.click(toggle());

    fireEvent.keyDown(window, { key: "Escape" });
    expect(drawer().hasAttribute("hidden")).toBe(true);
  });

  it("should leave the drawer open when a key other than escape is pressed", () => {
    render(<Toc entries={ENTRIES} />);
    fireEvent.click(toggle());

    fireEvent.keyDown(window, { key: "a" });
    expect(drawer().hasAttribute("hidden")).toBe(false);
  });

  it("should report the drawer state on the toggle for assistive tech", () => {
    render(<Toc entries={ENTRIES} />);
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(toggle().getAttribute("aria-controls")).toBe("tm-toc-drawer");

    fireEvent.click(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });
});
