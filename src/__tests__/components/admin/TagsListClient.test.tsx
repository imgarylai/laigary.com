// @vitest-environment jsdom
//
// The tags list. The usage column counts posts AND notes; a tag used only by
// interview notes reading "—" would look unused and invite deleting it, so the
// fixtures below deliberately separate the two contributions rather than giving
// every tag both.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { TagsListClient } from "@/components/admin/TagsListClient";

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
vi.mock("@/server/admin/tags", () => ({
  createTagFn: vi.fn(),
  updateTagFn: vi.fn(),
  deleteTagFn: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

function tag(over: Partial<Parameters<typeof TagsListClient>[0]["tags"][number]> = {}) {
  return {
    id: "t1",
    name: "Go",
    slug: "go",
    postCount: 0,
    noteCount: 0,
    usedBy: [],
    ...over,
  };
}

/** The usage cell for a given row, by the tag's slug. */
function usageFor(slug: string): string {
  const row = screen.getByText(slug).closest("tr")!;
  return row.querySelectorAll("td")[2].textContent ?? "";
}

beforeEach(() => {
  useSearch.mockReturnValue({});
});
afterEach(cleanup);

describe("TagsListClient usage column", () => {
  it("counts posts and notes together", () => {
    render(<TagsListClient tags={[tag({ postCount: 2, noteCount: 3 })]} />);

    expect(usageFor("go")).toBe("5");
  });

  it("counts a tag used only by notes rather than showing it unused", () => {
    // The mutation this catches: summing postCount alone. A notes-only tag then
    // reads "—" and looks safe to delete.
    render(<TagsListClient tags={[tag({ slug: "dp", postCount: 0, noteCount: 4 })]} />);

    expect(usageFor("dp")).toBe("4");
  });

  it("counts a tag used only by posts", () => {
    render(<TagsListClient tags={[tag({ slug: "go", postCount: 2, noteCount: 0 })]} />);

    expect(usageFor("go")).toBe("2");
  });

  it("shows an em dash for a tag nothing uses", () => {
    render(<TagsListClient tags={[tag({ slug: "unused" })]} />);

    expect(usageFor("unused")).toBe("—");
  });
});

describe("TagsListClient rows", () => {
  it("links each tag to its filtered archive rather than a per-tag page", () => {
    render(<TagsListClient tags={[tag({ slug: "go" })]} />);

    const view = screen.getByTitle("tagList.view");
    expect(view.getAttribute("href")).toBe("/posts");
    expect(view.getAttribute("target")).toBe("_blank");
  });

  it("puts the name and slug in their own columns", () => {
    render(<TagsListClient tags={[tag({ name: "Golang", slug: "go" })]} />);

    const cells = screen.getByText("go").closest("tr")!.querySelectorAll("td");
    expect(cells[0].textContent).toBe("Golang");
    expect(cells[1].textContent).toBe("go");
  });
});

describe("TagsListClient url state", () => {
  it("pushes the search box value into the url", async () => {
    render(<TagsListClient tags={[tag()]} />);

    fireEvent.change(screen.getByPlaceholderText("tagList.searchPlaceholder"), {
      target: { value: "go" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual({ q: "go" });
  });

  it("drops q from the url when the search box is cleared", async () => {
    useSearch.mockReturnValue({ q: "go" });
    render(<TagsListClient tags={[tag()]} />);

    fireEvent.change(screen.getByPlaceholderText("tagList.searchPlaceholder"), {
      target: { value: "" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ q: "go" })).toEqual({ q: undefined });
  });
});
