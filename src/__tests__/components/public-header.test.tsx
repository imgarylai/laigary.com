// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { PublicHeader } from "@/features/public-site/Header";
import { I18nProvider } from "@/i18n/I18nProvider";

const { pathname } = vi.hoisted(() => ({ pathname: { value: "/" } }));
vi.mock("@tanstack/react-router", () => ({
  linkOptions: (options: unknown) => options,
  useRouterState: (options: { select: (state: unknown) => unknown }) =>
    options.select({ location: { pathname: pathname.value } }),
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to: string;
    params?: { slug: string };
    children: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  }) => (
    <a
      href={params ? `/${params.slug}` : to}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        rest.onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));
vi.mock("@/features/public-site/ThemeMenu", () => ({ PublicThemeMenu: () => null }));
beforeEach(() => {
  pathname.value = "/";
});
afterEach(cleanup);
function header() {
  return render(
    <I18nProvider initialLocale="en">
      <PublicHeader onOpenSearch={vi.fn()} />
    </I18nProvider>,
  );
}

describe("public header", () => {
  it("should show Gary Lai and three content links when rendered", () => {
    header();
    expect(screen.getByRole("link", { name: "Gary Lai" }).getAttribute("href")).toBe("/");
    const links = within(screen.getByRole("navigation", { name: "Main navigation" })).getAllByRole(
      "link",
    );
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Writing", "/posts"],
      ["Work", "/works"],
      ["About", "/about"],
    ]);
  });
  it("should open and close the menu when its button is activated", () => {
    header();
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
  });
  it("should close the menu when a destination is selected", () => {
    header();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(
      within(screen.getByRole("navigation", { name: "Mobile navigation" })).getByRole("link", {
        name: "Work",
      }),
    );
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
  });
  it("should return focus to the trigger when Escape closes the menu", () => {
    header();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const link = within(screen.getByRole("navigation", { name: "Mobile navigation" })).getByRole(
      "link",
      { name: "Writing" },
    );
    link.focus();
    fireEvent.keyDown(link, { key: "Escape" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Menu" }));
  });
  it("should update the navigation and locale cookie when language changes", () => {
    header();
    fireEvent.click(screen.getByRole("button", { name: "切換為繁體中文" }));
    expect(screen.getByRole("link", { name: "文章" })).toBeTruthy();
    expect(document.cookie).toContain("locale=zh-TW");
    fireEvent.click(screen.getByRole("button", { name: "Switch to English" }));
    expect(screen.getByRole("link", { name: "Writing" })).toBeTruthy();
    expect(document.cookie).toContain("locale=en");
  });
  it("should close the menu when navigation changes outside the menu", () => {
    const view = header();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    pathname.value = "/works";
    view.rerender(
      <I18nProvider initialLocale="en">
        <PublicHeader onOpenSearch={vi.fn()} />
      </I18nProvider>,
    );
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
  });
});
