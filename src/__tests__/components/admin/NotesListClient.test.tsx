// @vitest-environment jsdom
//
// The notes list gets the same row treatment as posts (AGENTS.md), so it gets
// the same proof rather than being assumed to follow (#180, #181).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { NotesListClient } from "@/components/admin/NotesListClient";

const { navigate, useSearch } = vi.hoisted(() => ({
  navigate: vi.fn(),
  useSearch: vi.fn<() => { q?: string; page?: number; sort?: string; dir?: "asc" | "desc" }>(
    () => ({}),
  ),
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
vi.mock("@/server/admin/interview", () => ({ deleteNoteFn: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

const notes = [
  {
    id: "n1",
    slug: "two-sum",
    title: "Two Sum",
    status: "published",
    pinned: false,
    sectionId: "s1",
    sectionLabel: "Arrays",
    sectionSlug: "arrays",
  },
  {
    id: "n2",
    slug: "wip",
    title: "Draft note",
    status: "draft",
    pinned: false,
    sectionId: "s1",
    sectionLabel: "Arrays",
    sectionSlug: "arrays",
  },
];

// The list is server-paginated: `notes` is one page and `total` is what the
// pager divides, so a test that wants two pages says so with `total` rather
// than by handing over more rows than a page holds.
function renderList(props: { notes?: typeof notes; total?: number } = {}) {
  const rows = props.notes ?? notes;
  return render(<NotesListClient notes={rows} total={props.total ?? rows.length} pageSize={20} />);
}

/** One page of rows out of 21 — enough total for a second page to exist. */
const twoPages = { total: 21 };
/** Enough total that `?page=4` is a real page and not snapped back into range. */
const manyPages = { total: 100 };

beforeEach(() => {
  vi.clearAllMocks();
  useSearch.mockReturnValue({});
});
afterEach(cleanup);

describe("NotesListClient", () => {
  it("should translate the status rather than printing the stored value", () => {
    renderList();

    expect(screen.getByText("postForm.published")).toBeTruthy();
    expect(screen.getByText("postForm.draft")).toBeTruthy();
    expect(screen.queryByText("published")).toBeNull();
  });

  it("should carry no delete button on the row itself", () => {
    renderList();

    expect(screen.queryByRole("button", { name: "noteList.delete" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "noteList.actions" }).length).toBe(2);
  });

  it("should open the editor when a row is clicked", () => {
    renderList();

    fireEvent.click(screen.getByText("postForm.published").closest("tr")!);

    expect(navigate).toHaveBeenCalledWith({
      to: "/admin/interview/notes/$noteId/edit",
      params: { noteId: "n1" },
    });
  });

  it("should show the section a note belongs to", () => {
    renderList();

    expect(screen.getAllByText("Arrays").length).toBe(2);
  });

  it("should offer to view the published row but not the draft one", async () => {
    // row-actions.test.tsx proves NoteRowActions honours `published`; nothing
    // proved this list DERIVES it from the row's status. Hardcode it true and a
    // draft gets a "view live" link straight to a 404.
    renderList();
    const menus = screen.getAllByRole("button", { name: "noteList.actions" });
    const rowOf = (slugText: string) =>
      menus.find((m) => m.closest("tr")?.textContent?.includes(slugText))!;

    fireEvent.click(rowOf("Two Sum"));
    expect(await screen.findByRole("menuitem", { name: /noteList.view/ })).toBeTruthy();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    fireEvent.click(rowOf("Draft note"));

    await screen.findByRole("menuitem", { name: /postList.edit/ });
    expect(screen.queryByRole("menuitem", { name: /noteList.view/ })).toBeNull();
  });
});

// The list's three URL writers. Everything above proves what the rows render;
// these prove the filter/pager state survives a reload, which is the whole
// reason it lives in the URL rather than in component state.
describe("NotesListClient url state", () => {
  it("pushes the search box value into the url", async () => {
    renderList();

    fireEvent.change(screen.getByPlaceholderText("noteList.searchPlaceholder"), {
      target: { value: "two" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ q: "two" }));
  });

  it("drops q from the url when the search box is cleared", async () => {
    useSearch.mockReturnValue({ q: "two" });
    renderList();

    fireEvent.change(screen.getByPlaceholderText("noteList.searchPlaceholder"), {
      target: { value: "" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ q: "two" })).toEqual(expect.objectContaining({ q: undefined }));
  });

  it("pushes the page number into the url", async () => {
    renderList(twoPages);

    fireEvent.click(screen.getByText("pagination.next"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ page: 2 }));
  });

  it("drops page from the url on the way back to the first page", async () => {
    // Page 1 is the default view, so it stays out of the URL entirely.
    useSearch.mockReturnValue({ page: 2 });
    renderList(twoPages);

    fireEvent.click(screen.getByText("pagination.prev"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ page: 2 })).toEqual(expect.objectContaining({ page: undefined }));
  });
});

// Server-driven mode moved three things out of the browser and into the query.
// These cover what that move can get wrong: a sort the server never hears
// about, a stale page number surviving a new result set, and a query per
// keystroke.
describe("NotesListClient server-driven list", () => {
  it("puts the sorted column in the url so the server can order by it", async () => {
    renderList();

    fireEvent.click(screen.getByText("noteList.title"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ sort: "title", dir: "asc" }));
  });

  it("reverses direction on a second click of the same column", async () => {
    useSearch.mockReturnValue({ sort: "title", dir: "asc" });
    renderList();

    fireEvent.click(screen.getByText("noteList.title"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ sort: "title", dir: "desc" }));
  });

  it("returns to page 1 when the search changes the result set", async () => {
    // Page 4 of the old result set is not page 4 of the new one — keeping the
    // number would land the author on an empty page.
    useSearch.mockReturnValue({ page: 4 });
    renderList(manyPages);

    fireEvent.change(screen.getByPlaceholderText("noteList.searchPlaceholder"), {
      target: { value: "two" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ page: 4 })).toEqual(expect.objectContaining({ q: "two", page: undefined }));
  });

  it("returns to page 1 when the sort changes the result set", async () => {
    useSearch.mockReturnValue({ page: 4 });
    renderList(manyPages);

    fireEvent.click(screen.getByText("noteList.title"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ page: 4 })).toEqual(expect.objectContaining({ page: undefined }));
  });

  it("spends one navigation on a word typed a letter at a time", async () => {
    // Each navigation re-runs the loader against D1. Without the debounce this
    // is one query per keystroke, which is the shape of the problem the server
    // pagination was meant to fix.
    renderList();
    const box = screen.getByPlaceholderText("noteList.searchPlaceholder");

    fireEvent.change(box, { target: { value: "t" } });
    fireEvent.change(box, { target: { value: "tw" } });
    fireEvent.change(box, { target: { value: "two" } });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledTimes(1);
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ q: "two" }));
  });

  it("keeps the typed text visible while the debounce is still pending", () => {
    renderList();
    const box = screen.getByPlaceholderText("noteList.searchPlaceholder") as HTMLInputElement;

    fireEvent.change(box, { target: { value: "tw" } });

    // The URL has not caught up yet, so a box bound straight to `q` would blank
    // itself back out mid-word.
    expect(box.value).toBe("tw");
    expect(navigate).not.toHaveBeenCalled();
  });
});
