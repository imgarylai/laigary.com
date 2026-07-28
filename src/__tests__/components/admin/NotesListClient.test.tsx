// @vitest-environment jsdom
//
// The notes list gets the same row treatment as posts (AGENTS.md), so it gets
// the same proof rather than being assumed to follow (#180, #181).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { NotesListClient } from "@/components/admin/NotesListClient";

const { navigate, useSearch } = vi.hoisted(() => ({
  navigate: vi.fn(),
  useSearch: vi.fn<() => { q?: string; page?: number }>(() => ({})),
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

beforeEach(() => {
  vi.clearAllMocks();
  useSearch.mockReturnValue({});
});
afterEach(cleanup);

describe("NotesListClient", () => {
  it("should translate the status rather than printing the stored value", () => {
    render(<NotesListClient notes={notes} />);

    expect(screen.getByText("postForm.published")).toBeTruthy();
    expect(screen.getByText("postForm.draft")).toBeTruthy();
    expect(screen.queryByText("published")).toBeNull();
  });

  it("should carry no delete button on the row itself", () => {
    render(<NotesListClient notes={notes} />);

    expect(screen.queryByRole("button", { name: "noteList.delete" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "noteList.actions" }).length).toBe(2);
  });

  it("should open the editor when a row is clicked", () => {
    render(<NotesListClient notes={notes} />);

    fireEvent.click(screen.getByText("postForm.published").closest("tr")!);

    expect(navigate).toHaveBeenCalledWith({
      to: "/admin/interview/notes/$noteId/edit",
      params: { noteId: "n1" },
    });
  });

  it("should show the section a note belongs to", () => {
    render(<NotesListClient notes={notes} />);

    expect(screen.getAllByText("Arrays").length).toBe(2);
  });

  it("should offer to view the published row but not the draft one", async () => {
    // row-actions.test.tsx proves NoteRowActions honours `published`; nothing
    // proved this list DERIVES it from the row's status. Hardcode it true and a
    // draft gets a "view live" link straight to a 404.
    render(<NotesListClient notes={notes} />);
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
  const many = Array.from({ length: 21 }, (_, i) => ({
    ...notes[0],
    id: `n${i}`,
    slug: `note-${i}`,
    title: `Note ${i}`,
  }));

  it("pushes the search box value into the url", async () => {
    render(<NotesListClient notes={notes} />);

    fireEvent.change(screen.getByPlaceholderText("noteList.searchPlaceholder"), {
      target: { value: "two" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ q: "two" }));
  });

  it("drops q from the url when the search box is cleared", async () => {
    useSearch.mockReturnValue({ q: "two" });
    render(<NotesListClient notes={notes} />);

    fireEvent.change(screen.getByPlaceholderText("noteList.searchPlaceholder"), {
      target: { value: "" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ q: "two" })).toEqual(expect.objectContaining({ q: undefined }));
  });

  it("pushes the page number into the url", async () => {
    render(<NotesListClient notes={many} />);

    fireEvent.click(screen.getByText("pagination.next"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ page: 2 }));
  });

  it("drops page from the url on the way back to the first page", async () => {
    // Page 1 is the default view, so it stays out of the URL entirely.
    useSearch.mockReturnValue({ page: 2 });
    render(<NotesListClient notes={many} />);

    fireEvent.click(screen.getByText("pagination.prev"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ page: 2 })).toEqual(expect.objectContaining({ page: undefined }));
  });
});
