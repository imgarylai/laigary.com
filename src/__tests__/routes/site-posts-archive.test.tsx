// @vitest-environment happy-dom
//
// The /posts archive route component. Its loader hands over every published
// post and the *client* does the work: split the pinned block out, apply the
// `?tag=` filter, paginate at 8, and group what is left by year. None of that
// ran under test before — v8 counts an un-called component as a single
// executable line, so the whole thing sat behind one uncovered line.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { installShellStubs, renderRoute, warmRouteTree } from "../helpers/router";

// The five mocks every route-component test needs — see helpers/router for why
// each one is load-bearing. vi.mock factories are hoisted per file, so they
// cannot be installed from the helper.
vi.mock("@/lib/og/render", () => ({ renderOgPng: vi.fn() }));
vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtoolsPanel: () => null }));
vi.mock("@/i18n/I18nProvider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));
vi.mock("@/server/locale", () => ({ resolveLocaleFn: async () => "en" }));
vi.mock("@/server/posts", () => ({ searchPostsFn: async () => ({ posts: [], total: 0 }) }));

const postsDataFn = vi.fn();
vi.mock("@/server/public", () => ({
  blogShellFn: async () => ({
    siteName: "Unconstrained",
    social: { github: null, twitter: null, linkedin: null, email: null },
  }),
  postsDataFn: () => postsDataFn(),
}));

installShellStubs();

function post(slug: string, date: string, extra: Record<string, unknown> = {}) {
  return {
    slug,
    title: `Post ${slug}`,
    excerpt: null,
    coverImageUrl: null,
    date,
    readingTime: 3,
    pinned: false,
    tags: [],
    ...extra,
  };
}

function withPosts(posts: unknown[]) {
  postsDataFn.mockResolvedValue({ posts, pageTitle: "Posts", siteName: "Unconstrained" });
}

/** 10 posts across two years — one more than a single 8-item page holds. */
function tenPosts() {
  return [
    ...Array.from({ length: 6 }, (_, i) => post(`n${i}`, `2025-06-${String(i + 10)}`)),
    ...Array.from({ length: 4 }, (_, i) => post(`o${i}`, `2024-03-${String(i + 10)}`)),
  ];
}

// Charge the route-tree import to a hook, not to whichever test renders
// first — under coverage it alone exceeds the default 5s test timeout.
beforeAll(warmRouteTree, 60_000);
beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("/posts archive", () => {
  it("groups the page's posts under a heading per year, newest first", async () => {
    // Three years, seeded scrambled on purpose. The grouping Map keeps
    // insertion order, so a fixture that already arrives newest-first cannot
    // tell `.sort().reverse()` from no sorting at all — and this order also
    // fails on a `.sort()` that forgets to reverse.
    withPosts([
      post("mid", "2024-11-09"),
      post("newest", "2025-08-21"),
      post("oldest", "2023-01-04"),
    ]);

    await renderRoute("/posts");

    await screen.findByText("Post newest");
    const years = screen.getAllByText(/^\.\/\d{4}\/$/).map((el) => el.textContent);
    expect(years).toEqual(["./2025/", "./2024/", "./2023/"]);
  });

  it("lifts pinned posts into their own block and out of the chronological list", async () => {
    withPosts([post("pin", "2025-01-01", { pinned: true }), post("plain", "2025-02-02")]);

    await renderRoute("/posts");

    await screen.findByText("./pinned/");
    expect(screen.getByText("Post pin")).toBeTruthy();
    // The pinned post appears once — in its own block, not again under its year.
    expect(screen.getAllByText("Post pin")).toHaveLength(1);
    expect(screen.getByText("Post plain")).toBeTruthy();
  });

  it("paginates at 8 and leaves the overflow off page one", async () => {
    withPosts(tenPosts());

    await renderRoute("/posts");

    await screen.findByText("Post n0");
    // 6 from 2025 + the first 2 of 2024 fill the page; the last 2 spill over.
    expect(screen.getByText("Post o1")).toBeTruthy();
    expect(screen.queryByText("Post o2")).toBeNull();
    expect(screen.queryByText("Post o3")).toBeNull();
  });

  it("serves the requested later page", async () => {
    withPosts(tenPosts());

    await renderRoute("/posts?page=2");

    await screen.findByText("Post o2");
    expect(screen.getByText("Post o3")).toBeTruthy();
    expect(screen.queryByText("Post n0")).toBeNull();
  });

  it("clamps a page number past the end back to the last real page", async () => {
    // `safePage = Math.min(page ?? 1, totalPages)`. Without the clamp a
    // hand-typed or stale ?page= renders an empty archive instead of content.
    withPosts(tenPosts());

    await renderRoute("/posts?page=99");

    await screen.findByText("Post o2");
    expect(screen.getByText("Post o3")).toBeTruthy();
  });

  it("ignores a page number of 1 or below rather than paging off the front", async () => {
    // `validateSearch` maps page <= 1 to undefined. Left as the literal 0,
    // `start` would be -8 and `slice(-8, 0)` would render an empty archive.
    // The assertions have to distinguish this from ?page=2 and ?page=99, which
    // is why the overflow is checked as absent — findByText alone could not.
    withPosts(tenPosts());

    const { router } = await renderRoute("/posts?page=0");

    await screen.findByText("Post n0");
    expect(router.state.location.search).toEqual({});
    expect(screen.queryByText("Post o2")).toBeNull();
    expect(screen.queryByText("Post o3")).toBeNull();
  });

  it("filters to a tag and lets pinned posts compete on it like any other", async () => {
    const go = { slug: "go", name: "go" };
    withPosts([
      post("tagged", "2025-05-05", { tags: [go] }),
      post("pinned-tagged", "2025-04-04", { pinned: true, tags: [go] }),
      post("untagged", "2025-03-03"),
    ]);

    await renderRoute("/posts?tag=go");

    await screen.findByText("Post tagged");
    // While filtering there is no separate pinned block — it competes on tags.
    expect(screen.queryByText("./pinned/")).toBeNull();
    expect(screen.getByText("Post pinned-tagged")).toBeTruthy();
    expect(screen.queryByText("Post untagged")).toBeNull();
  });

  it("shows the empty state when a tag matches nothing", async () => {
    withPosts([post("a", "2025-03-02")]);

    await renderRoute("/posts?tag=nope");

    expect(await screen.findByText("blog.archive.noMatch")).toBeTruthy();
    expect(screen.queryByText("Post a")).toBeNull();
  });

  it("drops a blank tag rather than filtering everything away", async () => {
    withPosts([post("a", "2025-03-02")]);

    await renderRoute("/posts?tag=");

    // validateSearch maps "" to undefined, so this is the unfiltered archive.
    expect(await screen.findByText("Post a")).toBeTruthy();
    expect(screen.queryByText("blog.archive.noMatch")).toBeNull();
  });

  it("keeps the tag when paging, so a filtered archive stays filtered", async () => {
    const go = { slug: "go", name: "go" };
    withPosts(
      Array.from({ length: 10 }, (_, i) =>
        post(`g${i}`, `2025-06-${String(i + 10)}`, { tags: [go] }),
      ),
    );

    const { router } = await renderRoute("/posts?tag=go");
    await screen.findByText("Post g0");

    screen.getByRole("button", { name: "2" }).click();

    await waitFor(() => expect(router.state.location.search).toEqual({ tag: "go", page: 2 }));
  });
});
