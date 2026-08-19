// @vitest-environment happy-dom
//
// The terminal header. It carries two controls that exist only on mobile — the
// hamburger and the drawer it opens — and those were the file's uncovered half:
// every other test renders the desktop nav, which is a different set of
// elements behind a `md:` breakpoint jsdom never evaluates. The drawer is the
// only navigation on a phone, so "does the toggle actually toggle" is not a
// cosmetic question.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TmHeader, type NavItem } from "@/features/terminal/TmHeader";

const { setLocale, locale, pathname } = vi.hoisted(() => ({
  setLocale: vi.fn(),
  locale: { value: "en" },
  pathname: { value: "/posts" },
}));

vi.mock("@tanstack/react-router", () => ({
  useRouterState: (opts: { select: (s: unknown) => unknown }) =>
    opts.select({ location: { pathname: pathname.value } }),
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: locale.value, setLocale }),
}));
vi.mock("@/features/terminal/ThemeMenu", () => ({ TmThemeMenu: () => null }));

const navItems: NavItem[] = [
  { label: "~", to: "/", cmd: "ls ~" },
  { label: "posts", to: "/posts", cmd: "cd ./posts" },
];

const props = { homeTo: "/", navItems, onOpenPalette: () => {} };

const hamburger = () => screen.getByTitle("common.menu");
const drawerCommands = () => screen.queryAllByText(/^\$ /).map((e) => e.textContent?.trim());

beforeEach(() => {
  locale.value = "en";
  pathname.value = "/posts";
});
afterEach(cleanup);

describe("TmHeader mobile drawer", () => {
  it("stays closed until the hamburger is pressed", () => {
    render(<TmHeader {...props} />);

    expect(drawerCommands()).toEqual([]);
  });

  it("lists every nav item as its shell command once opened", () => {
    // The drawer shows `cmd`, not `label` — `cat ./about.md` for a page rather
    // than `cd ./about`. Rendering the label instead would read as a directory.
    render(<TmHeader {...props} />);

    fireEvent.click(hamburger());

    expect(drawerCommands()).toEqual(["$ ls ~", "$ cd ./posts", "$ locale --set zh-TW"]);
  });

  it("closes again on a second press", () => {
    render(<TmHeader {...props} />);

    fireEvent.click(hamburger());
    fireEvent.click(hamburger());

    expect(drawerCommands()).toEqual([]);
  });

  it("offers the other locale and switches to it", () => {
    locale.value = "zh-TW";
    render(<TmHeader {...props} />);

    fireEvent.click(hamburger());
    fireEvent.click(screen.getByText("$ locale --set en"));

    expect(setLocale).toHaveBeenCalledWith("en");
  });
});

describe("TmHeader breadcrumb and nav", () => {
  it("shows the current path as a prompt", () => {
    pathname.value = "/posts/hello";
    render(<TmHeader {...props} />);

    // `~/` is the literal prefix; the rest is fsmap's crumb for the route, so a
    // post reads as the file it is rather than as a directory.
    expect(screen.getByText("~/posts/hello.md")).toBeTruthy();
  });

  it("highlights the nav item for the section being viewed", () => {
    pathname.value = "/posts";
    render(<TmHeader {...props} />);

    const posts = screen.getByText("posts");
    const home = screen.getByText("~");
    expect(posts.className).toContain("text-tm-accent");
    // Home must NOT light up just because every path starts with "/".
    expect(home.className).not.toContain("text-tm-accent");
  });
});
