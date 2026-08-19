// @vitest-environment happy-dom
//
// The interview sections list. Sibling of PagesListClient and covered for the
// same reason: the note-count cell decides between a number and an em dash, and
// that number is the only warning before a delete cascades to every note in the
// section (see DeleteSectionButton).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { SectionsListClient } from "@/components/admin/SectionsListClient";

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
vi.mock("@/server/admin/interview", () => ({
  createSectionFn: vi.fn(),
  updateSectionFn: vi.fn(),
  deleteSectionFn: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

function section(over: Partial<Parameters<typeof SectionsListClient>[0]["sections"][number]> = {}) {
  return {
    id: "s1",
    slug: "arrays",
    label: "Arrays",
    blurb: "index tricks",
    icon: "list",
    sortOrder: 1,
    noteCount: 0,
    ...over,
  };
}

/** The note-count cell for a given row, found by the section's slug. */
function notesFor(slug: string): string {
  const row = screen.getByText(slug).closest("tr")!;
  return row.querySelectorAll("td")[3].textContent ?? "";
}

beforeEach(() => {
  useSearch.mockReturnValue({});
});
afterEach(cleanup);

describe("SectionsListClient rows", () => {
  it("shows how many notes a section holds", () => {
    render(<SectionsListClient sections={[section({ noteCount: 12 })]} />);

    expect(notesFor("arrays")).toBe("12");
  });

  it("shows an em dash for a section with no notes yet", () => {
    // The mutation this catches: printing the raw count, so an empty section
    // reads "0" — visually the same weight as a section that has notes to lose.
    render(<SectionsListClient sections={[section({ noteCount: 0 })]} />);

    expect(notesFor("arrays")).toBe("—");
  });

  it("puts the label, slug and sort order in their own columns", () => {
    render(<SectionsListClient sections={[section({ label: "Arrays", sortOrder: 3 })]} />);

    const cells = screen.getByText("arrays").closest("tr")!.querySelectorAll("td");
    expect(cells[0].textContent).toBe("Arrays");
    expect(cells[1].textContent).toBe("arrays");
    expect(cells[2].textContent).toBe("3");
  });

  it("links each row to its live section page in a new tab", () => {
    render(<SectionsListClient sections={[section()]} />);

    const view = screen.getByTitle("sectionList.view");
    expect(view.getAttribute("href")).toBe("/interview/$section");
    expect(view.getAttribute("target")).toBe("_blank");
  });
});

describe("SectionsListClient url state", () => {
  it("pushes the search box value into the url", async () => {
    render(<SectionsListClient sections={[section()]} />);

    fireEvent.change(screen.getByPlaceholderText("sectionList.searchPlaceholder"), {
      target: { value: "arr" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual({ q: "arr" });
  });

  it("drops q from the url when the search box is cleared", async () => {
    useSearch.mockReturnValue({ q: "arr" });
    render(<SectionsListClient sections={[section()]} />);

    fireEvent.change(screen.getByPlaceholderText("sectionList.searchPlaceholder"), {
      target: { value: "" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ q: "arr" })).toEqual({ q: undefined });
  });

  it("restores the page the url asked for", () => {
    useSearch.mockReturnValue({ page: 2 });
    const sections = Array.from({ length: 21 }, (_, i) =>
      section({ id: `s${i}`, slug: `sect-${i}`, label: `Section ${i}` }),
    );
    render(<SectionsListClient sections={sections} />);

    expect(screen.getByText("Section 20")).toBeTruthy();
    expect(screen.queryByText("Section 0")).toBeNull();
  });
});

// Paging lives in the URL so a reload (or a back-navigation out of an item)
// lands on the page you were on rather than resetting to the top of the list.
describe("SectionsListClient paging", () => {
  const many = Array.from({ length: 21 }, (_, i) =>
    section({ id: `s${i}`, slug: `sect-${i}`, label: `Section ${i}` }),
  );

  it("pushes the page number into the url", async () => {
    render(<SectionsListClient sections={many} />);

    fireEvent.click(screen.getByText("pagination.next"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ page: 2 }));
  });

  it("drops page from the url on the way back to the first page", async () => {
    // Page 1 is the default view, so it stays out of the URL entirely — a
    // handler that always writes `idx + 1` leaves a redundant `?page=1` behind.
    useSearch.mockReturnValue({ page: 2 });
    render(<SectionsListClient sections={many} />);

    fireEvent.click(screen.getByText("pagination.prev"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ page: 2 })).toEqual(expect.objectContaining({ page: undefined }));
  });
});
