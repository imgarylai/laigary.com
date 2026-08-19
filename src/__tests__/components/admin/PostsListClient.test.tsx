// @vitest-environment happy-dom
//
// The posts list's own cells and row wiring (#180, #181). It was at 0%, which
// is how a raw English status badge and a filled red Delete button per row went
// unnoticed for as long as they did.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { PostsListClient } from "@/components/admin/PostsListClient";

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
vi.mock("@/server/admin/posts", () => ({ deletePostFn: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

const HOUR_AGO = Math.floor(Date.now() / 1000) - 3600;

const posts = [
  {
    id: "p1",
    slug: "live",
    title: "Live post",
    status: "published",
    pinned: false,
    publishedAt: HOUR_AGO,
    updatedAt: HOUR_AGO,
  },
  {
    id: "p2",
    slug: "wip",
    title: "Draft post",
    status: "draft",
    pinned: true,
    publishedAt: null,
    updatedAt: HOUR_AGO,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useSearch.mockReturnValue({});
});
afterEach(cleanup);

describe("PostsListClient", () => {
  it("should translate the status rather than printing the stored value", () => {
    render(<PostsListClient posts={posts} />);

    expect(screen.getByText("postForm.published")).toBeTruthy();
    expect(screen.getByText("postForm.draft")).toBeTruthy();
    expect(screen.queryByText("published")).toBeNull();
  });

  it("should show when a post was edited in relative terms", () => {
    render(<PostsListClient posts={posts} />);

    // Absolute dates are near-useless in a list where everything is recent.
    expect(screen.getAllByText("1 hour ago").length).toBe(2);
  });

  it("should keep the exact timestamp one hover away", () => {
    render(<PostsListClient posts={posts} />);

    const cell = screen.getAllByText("1 hour ago")[0];
    expect(cell.getAttribute("title")).toBeTruthy();
    expect(cell.getAttribute("title")).not.toBe("1 hour ago");
  });

  it("should carry no delete button on the row itself", () => {
    render(<PostsListClient posts={posts} />);

    // The whole point of #180: the loudest thing on the page was the most
    // destructive and least frequent action, once per row.
    expect(screen.queryByRole("button", { name: "deletePost.delete" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "postList.actions" }).length).toBe(2);
  });

  it("should open the editor when a row is clicked", () => {
    render(<PostsListClient posts={posts} />);

    fireEvent.click(screen.getByText("postForm.published").closest("tr")!);

    expect(navigate).toHaveBeenCalledWith({
      to: "/admin/posts/$postId/edit",
      params: { postId: "p1" },
    });
  });

  it("should label the closed status filter rather than showing its raw value", () => {
    // Base UI reads the trigger's label off the popup, which only mounts once
    // opened — without the `items` map the filter sits there reading "draft" in
    // English whatever the locale is.
    useSearch.mockReturnValue({ status: "draft" });

    render(<PostsListClient posts={posts} />);

    expect(screen.getByRole("combobox").textContent).toContain("postForm.draft");
  });

  it("should filter by the status in the URL", () => {
    // Filters live in the search params so the view survives a reload.
    useSearch.mockReturnValue({ status: "draft" });

    render(<PostsListClient posts={posts} />);

    expect(screen.getByText("Draft post")).toBeTruthy();
    expect(screen.queryByText("Live post")).toBeNull();
  });

  it("should mark a pinned post", () => {
    const { container } = render(<PostsListClient posts={posts} />);

    const pinnedRow = screen.getByText("Draft post").closest("tr")!;
    expect(pinnedRow.querySelector("svg")).toBeTruthy();
    expect(container).toBeTruthy();
  });
});

// The list's URL writers: the status dropdown, the search box and the pager all
// write into the route's search params so the filtered view survives a reload.
describe("PostsListClient url state", () => {
  // Base UI's Select portals its listbox only once open, and commits on the
  // pointer sequence rather than on a bare click (see NoteForm's helper).
  function selectStatus(optionText: string) {
    fireEvent.click(screen.getByRole("combobox"));
    const option = screen.getByRole("option", { name: optionText });
    fireEvent.pointerDown(option);
    fireEvent.pointerUp(option);
    fireEvent.click(option);
  }

  const many = Array.from({ length: 21 }, (_, i) => ({
    ...posts[0],
    id: `p${i}`,
    slug: `post-${i}`,
    title: `Post ${i}`,
  }));

  it("pushes the chosen status into the url", async () => {
    render(<PostsListClient posts={posts} />);

    selectStatus("postForm.draft");

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ status: "draft" }));
  });

  it("drops status from the url when the filter goes back to all", async () => {
    // "all" is the default view, so it is an absence in the URL rather than a
    // literal `?status=all` the route's validateSearch would then reject.
    useSearch.mockReturnValue({ status: "draft" });
    render(<PostsListClient posts={posts} />);

    selectStatus("postList.all");

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ status: "draft" })).toEqual(expect.objectContaining({ status: undefined }));
  });

  it("pushes the search box value into the url", async () => {
    render(<PostsListClient posts={posts} />);

    fireEvent.change(screen.getByPlaceholderText("postList.searchPlaceholder"), {
      target: { value: "live" },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ q: "live" }));
  });

  it("pushes the page number into the url", async () => {
    render(<PostsListClient posts={many} />);

    fireEvent.click(screen.getByText("pagination.next"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({})).toEqual(expect.objectContaining({ page: 2 }));
  });

  it("drops page from the url on the way back to the first page", async () => {
    useSearch.mockReturnValue({ page: 2 });
    render(<PostsListClient posts={many} />);

    fireEvent.click(screen.getByText("pagination.prev"));

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const search = navigate.mock.lastCall?.[0].search as (p: object) => object;
    expect(search({ page: 2 })).toEqual(expect.objectContaining({ page: undefined }));
  });
});
