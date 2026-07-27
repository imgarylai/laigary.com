// @vitest-environment jsdom
//
// The notes list gets the same row treatment as posts (AGENTS.md), so it gets
// the same proof rather than being assumed to follow (#180, #181).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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
});
