// @vitest-environment happy-dom
//
// The works list's own cells and row wiring, mirroring PostsListClient's tests.
// The extra column here is the year, which is what the portfolio sorts on.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { WorksListClient } from "@/components/admin/WorksListClient";

const { navigate, useSearch } = vi.hoisted(() => ({
  navigate: vi.fn(),
  // Annotated, or the initial all-undefined literal narrows the return type and
  // the status-filter test cannot hand it a real value.
  useSearch: vi.fn<() => { q?: string; status?: string; page?: number }>(() => ({})),
}));

// getRouteApi binds the component to a live route; the component's own
// behaviour is what matters here.
vi.mock("@tanstack/react-router", () => ({
  getRouteApi: () => ({ useSearch, useNavigate: () => navigate }),
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/server/admin/works", () => ({ deleteWorkFn: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

const HOUR_AGO = Math.floor(Date.now() / 1000) - 3600;

const works = [
  {
    id: "w1",
    slug: "live",
    title: "Live work",
    status: "published",
    pinned: false,
    year: 2025,
    updatedAt: HOUR_AGO,
  },
  {
    id: "w2",
    slug: "wip",
    title: "Draft work",
    status: "draft",
    pinned: true,
    year: 2019,
    updatedAt: HOUR_AGO,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useSearch.mockReturnValue({});
});
afterEach(cleanup);

describe("WorksListClient", () => {
  it("should show each work's year", () => {
    render(<WorksListClient works={works} />);

    expect(screen.getByText("2025")).toBeTruthy();
    expect(screen.getByText("2019")).toBeTruthy();
  });

  it("should translate the status rather than printing the stored value", () => {
    render(<WorksListClient works={works} />);

    expect(screen.getByText("postForm.published")).toBeTruthy();
    expect(screen.getByText("postForm.draft")).toBeTruthy();
    expect(screen.queryByText("published")).toBeNull();
  });

  it("should show when a work was edited in relative terms", () => {
    render(<WorksListClient works={works} />);

    expect(screen.getAllByText("1 hour ago").length).toBe(2);
  });

  it("should keep the exact timestamp one hover away", () => {
    render(<WorksListClient works={works} />);

    const cell = screen.getAllByText("1 hour ago")[0];
    expect(cell.getAttribute("title")).toBeTruthy();
    expect(cell.getAttribute("title")).not.toBe("1 hour ago");
  });

  it("should carry no delete button on the row itself", () => {
    render(<WorksListClient works={works} />);

    // Same call as the posts list: the most destructive and least frequent
    // action does not get to be the loudest thing on every row.
    expect(screen.queryByRole("button", { name: "deleteWork.delete" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "workList.actions" }).length).toBe(2);
  });

  it("should open the editor when a row is clicked", () => {
    render(<WorksListClient works={works} />);

    fireEvent.click(screen.getByText("postForm.published").closest("tr")!);

    expect(navigate).toHaveBeenCalledWith({
      to: "/admin/works/$workId/edit",
      params: { workId: "w1" },
    });
  });

  it("should filter by the status in the URL", () => {
    // Filters live in the search params so the view survives a reload.
    useSearch.mockReturnValue({ status: "draft" });

    render(<WorksListClient works={works} />);

    expect(screen.getByText("Draft work")).toBeTruthy();
    expect(screen.queryByText("Live work")).toBeNull();
  });

  it("should mark a pinned work", () => {
    render(<WorksListClient works={works} />);

    const pinnedRow = screen.getByText("Draft work").closest("tr")!;
    expect(pinnedRow.querySelector("svg")).toBeTruthy();
  });
});

// The list's URL writers: the status dropdown, the search box and the pager all
// write into the route's search params so the filtered view survives a reload.
describe("WorksListClient url state", () => {
  // Base UI's Select portals its listbox only once open, and commits on the
  // pointer sequence rather than on a bare click.
  function selectStatus(optionText: string) {
    fireEvent.click(screen.getByRole("combobox"));
    const option = screen.getByRole("option", { name: optionText });
    fireEvent.pointerDown(option);
    fireEvent.pointerUp(option);
    fireEvent.click(option);
  }

  const many = Array.from({ length: 21 }, (_, i) => ({
    ...works[0],
    id: `w${i}`,
    slug: `work-${i}`,
    title: `Work ${i}`,
  }));

  it("pushes the chosen status into the url", async () => {
    render(<WorksListClient works={works} />);

    selectStatus("postForm.draft");

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ status: "draft" }));
  });

  it("drops status from the url when the filter goes back to all", async () => {
    // "all" is the default view, so it is an absence in the URL rather than a
    // literal `?status=all` the route's validateSearch would then reject.
    useSearch.mockReturnValue({ status: "draft" });
    render(<WorksListClient works={works} />);

    selectStatus("workList.all");

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ status: "draft" })).toEqual(expect.objectContaining({ status: undefined }));
  });

  it("pushes the search box value into the url", async () => {
    render(<WorksListClient works={works} />);

    fireEvent.change(screen.getByPlaceholderText("workList.searchPlaceholder"), {
      target: { value: "live" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ q: "live" }));
  });

  it("pushes the page number into the url", async () => {
    render(<WorksListClient works={many} />);

    fireEvent.click(screen.getByText("pagination.next"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ page: 2 }));
  });

  it("drops page from the url on the way back to the first page", async () => {
    useSearch.mockReturnValue({ page: 2 });
    render(<WorksListClient works={many} />);

    fireEvent.click(screen.getByText("pagination.prev"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ page: 2 })).toEqual(expect.objectContaining({ page: undefined }));
  });
});
