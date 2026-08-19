// @vitest-environment happy-dom
//
// The pages list. AGENTS.md had these rows down as "would only restate their own
// JSX" — the cells maybe, but the file was at 6% because that reasoning also
// swallowed the parts that are not JSX: a date formatted against the UI locale,
// and the two callbacks that push the search box and the pager into the URL.
// Those are the same callbacks the tags/posts/notes lists have tests for.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { PagesListClient } from "@/components/admin/PagesListClient";

const { navigate, useSearch, locale } = vi.hoisted(() => ({
  navigate: vi.fn(),
  useSearch: vi.fn<() => { q?: string; page?: number }>(() => ({})),
  locale: { value: "en" },
}));

vi.mock("@tanstack/react-router", () => ({
  getRouteApi: () => ({ useSearch, useNavigate: () => navigate }),
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/server/admin/pages", () => ({ deletePageFn: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: locale.value }),
}));

// 2025-03-02T00:00:00Z. TZ is pinned to UTC in vitest.config.ts, so this is one
// exact day in every locale rather than a value that straddles midnight.
const MAR_2 = Math.floor(Date.UTC(2025, 2, 2) / 1000);

function page(over: Partial<Parameters<typeof PagesListClient>[0]["pages"][number]> = {}) {
  return { id: "g1", slug: "about", title: "About", updatedAt: MAR_2, ...over };
}

beforeEach(() => {
  locale.value = "en";
  useSearch.mockReturnValue({});
});
afterEach(cleanup);

describe("PagesListClient rows", () => {
  it("puts the title and its url path in their own columns", () => {
    render(<PagesListClient pages={[page({ title: "About Me", slug: "about" })]} />);

    const cells = screen.getByText("About Me").closest("tr")!.querySelectorAll("td");
    expect(cells[0].textContent).toBe("About Me");
    // The slug column shows the public path, not the bare slug — that is what
    // makes the row's destination legible at a glance.
    expect(cells[1].textContent).toBe("/about");
  });

  it("links the title to the editor", () => {
    render(<PagesListClient pages={[page({ slug: "about" })]} />);

    expect(screen.getByText("About").getAttribute("href")).toBe("/admin/pages/$slug/edit");
  });

  it("gives every row the same `⋯` menu the other admin lists have", () => {
    // Pages used to carry a lone view icon here, so there was no way to delete
    // one from the UI at all.
    render(<PagesListClient pages={[page({ slug: "about" }), page({ id: "g2", slug: "now" })]} />);

    expect(screen.getAllByRole("button", { name: "pageList.actions" }).length).toBe(2);
  });

  it("formats the updated date in the active UI locale", () => {
    // Fixture is a zh-TW render of a date whose formatting differs from en, so
    // ignoring `locale` and always formatting in English fails here.
    locale.value = "zh-TW";
    render(<PagesListClient pages={[page({ updatedAt: MAR_2 })]} />);

    const cells = screen.getByText("About").closest("tr")!.querySelectorAll("td");
    expect(cells[2].textContent).toBe("2025年3月2日");
  });

  it("formats the updated date in English when that is the UI locale", () => {
    render(<PagesListClient pages={[page({ updatedAt: MAR_2 })]} />);

    const cells = screen.getByText("About").closest("tr")!.querySelectorAll("td");
    expect(cells[2].textContent).toBe("Mar 2, 2025");
  });
});

describe("PagesListClient url state", () => {
  it("pushes the search box value into the url", async () => {
    render(<PagesListClient pages={[page()]} />);

    fireEvent.change(screen.getByPlaceholderText("pageList.searchPlaceholder"), {
      target: { value: "about" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual({ q: "about" });
  });

  it("drops q from the url when the search box is cleared", async () => {
    useSearch.mockReturnValue({ q: "about" });
    render(<PagesListClient pages={[page()]} />);

    fireEvent.change(screen.getByPlaceholderText("pageList.searchPlaceholder"), {
      target: { value: "" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ q: "about" })).toEqual({ q: undefined });
  });

  it("restores the page the url asked for", () => {
    // Page 2 of 21 rows at the table's 20-per-page: only the last row shows.
    useSearch.mockReturnValue({ page: 2 });
    const pages = Array.from({ length: 21 }, (_, i) =>
      page({ id: `g${i}`, slug: `p${i}`, title: `Page ${i}` }),
    );
    render(<PagesListClient pages={pages} />);

    expect(screen.getByText("Page 20")).toBeTruthy();
    expect(screen.queryByText("Page 0")).toBeNull();
  });
});

// Paging lives in the URL so a reload (or a back-navigation out of an item)
// lands on the page you were on rather than resetting to the top of the list.
describe("PagesListClient paging", () => {
  const many = Array.from({ length: 21 }, (_, i) =>
    page({ id: `g${i}`, slug: `p${i}`, title: `Page ${i}` }),
  );

  it("pushes the page number into the url", async () => {
    render(<PagesListClient pages={many} />);

    fireEvent.click(screen.getByText("pagination.next"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ page: 2 }));
  });

  it("drops page from the url on the way back to the first page", async () => {
    // Page 1 is the default view, so it stays out of the URL entirely — a
    // handler that always writes `idx + 1` leaves a redundant `?page=1` behind.
    useSearch.mockReturnValue({ page: 2 });
    render(<PagesListClient pages={many} />);

    fireEvent.click(screen.getByText("pagination.prev"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ page: 2 })).toEqual(expect.objectContaining({ page: undefined }));
  });
});
