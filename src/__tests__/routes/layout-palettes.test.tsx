// @vitest-environment happy-dom
//
// The ⌘K palettes the two layout routes build. AGENTS.md listed these as
// "uncovered by choice" because the fake-timer flow deadlocked against the
// palette's async open — it does, if the clock is faked before the dialog
// mounts. Opening on the real clock and only then faking it for the debounce
// avoids that, and gets at the part that matters: every palette row carries an
// `onSelect` closure that is the only definition of where that row goes, and
// `paletteSearch` is the only place the query reaches the server. A row wired to
// the wrong route looks perfectly fine until someone picks it.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, screen, within, waitFor } from "@testing-library/react";
import { installShellStubs, renderRoute, warmRouteTree } from "../helpers/router";

// See helpers/router for why each of these is load-bearing.
vi.mock("next-themes", () => import("../helpers/next-themes").then((m) => m.mockNextThemes()));
vi.mock("@/lib/og/render", () => ({ renderOgPng: vi.fn() }));
vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtoolsPanel: () => null }));
vi.mock("@/i18n/I18nProvider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));
vi.mock("@/server/locale", () => ({ resolveLocaleFn: async () => "en" }));
vi.mock("@/components/Comments", () => ({ Comments: () => null }));

// Both handles are typed against the real awaited return type, for the reason
// interview-section.test.tsx spells out (#208): searchInterviewNotesFn returns a
// BARE ARRAY, and a fixture that drifts to an object shape should fail
// `pnpm typecheck` rather than quietly become the suite's description of a
// contract that never existed.
type PostsSearchResult = Awaited<ReturnType<(typeof import("@/server/posts"))["searchPostsFn"]>>;
type NotesSearchResult = Awaited<
  ReturnType<(typeof import("@/server/public"))["searchInterviewNotesFn"]>
>;

const { searchPostsFn, searchInterviewNotesFn } = vi.hoisted(() => ({
  searchPostsFn:
    vi.fn<(opts: { data: { q: string; limit: number } }) => Promise<PostsSearchResult>>(),
  searchInterviewNotesFn: vi.fn<(opts: { data: { q: string } }) => Promise<NotesSearchResult>>(),
}));

vi.mock("@/server/posts", () => ({ searchPostsFn }));
vi.mock("@/server/public", () => ({
  blogShellFn: async () => ({
    siteName: "Unconstrained",
    social: { github: null, twitter: null, linkedin: null, email: null },
  }),
  interviewShellFn: async () => ({
    sections: [
      { slug: "coding", label: "Coding" },
      { slug: "system", label: "System Design" },
    ],
    siteName: "Unconstrained",
    social: { github: null, twitter: null, linkedin: null, email: null },
  }),
  searchInterviewNotesFn,
  homeDataFn: async () => ({
    pageTitle: "T",
    siteName: "U",
    whoami: "gary",
    intro: "",
    postCount: 0,
    tagCount: 0,
    latestDate: null,
    socialUrls: [],
  }),
  labsChromeFn: async () => ({ pageTitle: "Labs", siteName: "Gary Lai" }),
  tagsDataFn: async () => ({ pageTitle: "T", siteName: "U", tags: [] }),
  worksDataFn: async () => ({ pageTitle: "T", siteName: "U", works: [] }),
  tagDataFn: async () => ({
    pageTitle: "T",
    siteName: "U",
    tag: { slug: "go", name: "go" },
    posts: [],
    notes: [],
  }),
  pageDataFn: async () => ({
    pageTitle: "T",
    siteName: "U",
    page: { slug: "about", title: "About" },
    html: "",
    description: "",
  }),
  postDataFn: async () => ({
    pageTitle: "T",
    siteName: "U",
    post: {
      slug: "hello",
      title: "Hello World",
      date: "2025-07-19",
      readingTime: 5,
      tags: [],
      excerpt: null,
      coverImageUrl: null,
    },
    html: "",
    toc: [],
    adjacent: { prev: null, next: null },
    giscus: null,
    description: "",
  }),
  interviewDataFn: async () => ({ pageTitle: "T", siteName: "U", sections: [], recent: [] }),
  postsDataFn: async () => ({ pageTitle: "T", siteName: "U", posts: [], total: 0, tags: [] }),
  sectionDataFn: async () => ({
    pageTitle: "T",
    siteName: "U",
    section: { slug: "coding", label: "Coding", blurb: "" },
    tags: [],
    notes: [],
    pinned: [],
    page: 1,
    pageSize: 20,
    total: 0,
  }),
  noteDataFn: async () => ({
    pageTitle: "T",
    siteName: "U",
    note: {
      slug: "gas",
      section: "coding",
      sectionLabel: "Coding",
      title: "Gas Station",
      date: "2025-06-01",
      updatedAt: "2025-06-02",
      minutes: 6,
      tags: [],
    },
    html: "",
    toc: [],
  }),
}));

installShellStubs();

// Comfortably past CommandPalette's 180ms query debounce.
const PAST_DEBOUNCE = 400;

// A full PublicPost, not just the two fields the palette happens to read — the
// typed handle above rejects the short version, which is the point of it.
const helloPost: PostsSearchResult["posts"][number] = {
  slug: "hello",
  title: "Hello World",
  excerpt: null,
  coverImageUrl: null,
  date: "2025-07-19",
  readingTime: 5,
  pinned: false,
  tags: [],
};

/**
 * Open the palette on the REAL clock. Faking it first is what deadlocks: the
 * dialog's own open is async, and its pending work never settles against a
 * clock nothing is advancing.
 */
async function openPalette(placeholder: string) {
  // The shell only exists once the layout loader has resolved; pressing before
  // that lands on a document nothing is listening to yet. The header's hostname
  // is part of the shell, so waiting on it means the hotkey is bound.
  await screen.findByRole("link", { name: "public.brand" });
  // `mod+k`, which react-hotkeys-hook resolves to Control off Apple platforms —
  // and jsdom's user agent is not one. See tm-terminal-shell.test.tsx.
  fireEvent.keyDown(document, { key: "k", code: "KeyK", ctrlKey: true });
  return screen.findByPlaceholderText(placeholder);
}

/**
 * Type a query and drive the debounce with fake timers, then hand the clock
 * back. Assert synchronously afterwards — `advanceTimersByTimeAsync` flushes the
 * pending microtasks, so the search has already settled. Never mix
 * `findBy`/`waitFor` with the fake clock; their polling deadlocks against it.
 */
async function typeAndSettle(input: HTMLElement, value: string) {
  vi.useFakeTimers();
  try {
    fireEvent.change(input, { target: { value } });
    await act(() => vi.advanceTimersByTimeAsync(PAST_DEBOUNCE));
  } finally {
    vi.useRealTimers();
  }
}

beforeAll(warmRouteTree, 60_000);
beforeEach(() => {
  searchPostsFn.mockResolvedValue({ posts: [], total: 0 });
  searchInterviewNotesFn.mockResolvedValue([]);
});
afterEach(() => cleanup());

describe("blog palette", () => {
  it("offers a row per static blog destination", async () => {
    await renderRoute("/");
    await openPalette("blog.search.placeholder");

    // Human destination names replace the old filesystem commands.
    for (const cmd of [
      "public.home",
      "public.writing",
      "public.work",
      "public.topics",
      "public.notes",
      "public.about",
    ]) {
      expect(within(screen.getByRole("dialog")).getByText(cmd)).toBeTruthy();
    }
  });

  it("navigates to the archive when its row is picked", async () => {
    const { router } = await renderRoute("/");
    await openPalette("blog.search.placeholder");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("public.writing"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/posts"));
  });

  it("navigates into the interview sub-site from the blog palette", async () => {
    // Crossing namespaces is the row most likely to be mis-wired, since every
    // other row stays inside the blog.
    const { router } = await renderRoute("/");
    await openPalette("blog.search.placeholder");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("public.notes"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/interview"));
  });

  it("should open a lab when its search result is selected", async () => {
    const { router } = await renderRoute("/");
    await openPalette("blog.search.placeholder");
    fireEvent.click(within(screen.getByRole("dialog")).getByText("use-tw-zipcode"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/labs/use-tw-zipcode"));
  });

  it("navigates to the works index when its row is picked", async () => {
    const { router } = await renderRoute("/");
    await openPalette("blog.search.placeholder");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("public.work"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/works"));
  });

  it("navigates to the tag index when its row is picked", async () => {
    const { router } = await renderRoute("/");
    await openPalette("blog.search.placeholder");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("public.topics"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/tags"));
  });

  it("navigates to the about page, which is a page route and not a directory", async () => {
    const { router } = await renderRoute("/");
    await openPalette("blog.search.placeholder");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("public.about"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/about"));
  });

  it("goes home from the archive", async () => {
    const { router } = await renderRoute("/posts");
    await openPalette("blog.search.placeholder");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("public.home"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  it("searches posts on demand and lists them as content rows", async () => {
    searchPostsFn.mockResolvedValue({ posts: [helloPost], total: 1 });
    await renderRoute("/");
    const input = await openPalette("blog.search.placeholder");

    await typeAndSettle(input, "hello");

    expect(searchPostsFn).toHaveBeenCalledWith({ data: { q: "hello", limit: 20 } });
    // Content rows lead with the human title and tuck the path underneath.
    expect(within(screen.getByRole("dialog")).getByText("Hello World")).toBeTruthy();
    expect(within(screen.getByRole("dialog")).getByText("public.essay")).toBeTruthy();
  });

  it("opens the post a content row points at", async () => {
    searchPostsFn.mockResolvedValue({ posts: [helloPost], total: 1 });
    const { router } = await renderRoute("/");
    const input = await openPalette("blog.search.placeholder");
    await typeAndSettle(input, "hello");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("Hello World"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/posts/hello"));
  });
});

describe("interview palette", () => {
  it("offers a row per section plus the way back to the blog", async () => {
    await renderRoute("/interview");
    await openPalette("blog.search.placeholder");

    // The same global destinations remain available alongside local sections.
    expect(within(screen.getByRole("dialog")).getByText("public.home")).toBeTruthy();
    expect(within(screen.getByRole("dialog")).getByText("Coding")).toBeTruthy();
    expect(within(screen.getByRole("dialog")).getByText("System Design")).toBeTruthy();
    expect(within(screen.getByRole("dialog")).getByText("public.home")).toBeTruthy();
  });

  it("navigates into a section when its row is picked", async () => {
    const { router } = await renderRoute("/interview");
    await openPalette("blog.search.placeholder");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("Coding"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/interview/coding"));
  });

  it("leaves the sub-site through the back-to-blog row", async () => {
    const { router } = await renderRoute("/interview");
    await openPalette("blog.search.placeholder");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("public.home"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  it("returns to the interview home from a section", async () => {
    const { router } = await renderRoute("/interview/coding");
    await openPalette("blog.search.placeholder");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("public.notes"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/interview"));
  });

  it("searches notes on demand across sections", async () => {
    searchInterviewNotesFn.mockResolvedValue([
      { slug: "gas", title: "Gas Station", section: "coding" },
    ]);
    await renderRoute("/interview");
    const input = await openPalette("blog.search.placeholder");

    await typeAndSettle(input, "gas");

    expect(searchInterviewNotesFn).toHaveBeenCalledWith({ data: { q: "gas" } });
    expect(within(screen.getByRole("dialog")).getByText("Gas Station")).toBeTruthy();
    // The note's own section is in its path — hardcoding one would send every
    // result to the same section.
    expect(within(screen.getByRole("dialog")).getByText("public.note")).toBeTruthy();
  });

  it("opens the note a content row points at", async () => {
    searchInterviewNotesFn.mockResolvedValue([
      { slug: "gas", title: "Gas Station", section: "coding" },
    ]);
    const { router } = await renderRoute("/interview");
    const input = await openPalette("blog.search.placeholder");
    await typeAndSettle(input, "gas");

    fireEvent.click(within(screen.getByRole("dialog")).getByText("Gas Station"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/interview/coding/gas"));
  });
});

describe("shared public search and navigation", () => {
  it.each(["/", "/interview", "/interview/coding", "/interview/coding/gas"])(
    "should expose the same three brand links when visiting %s",
    async (path) => {
      await renderRoute(path);
      expect(await screen.findByRole("link", { name: "public.brand" })).toBeTruthy();
      const nav = screen.getByRole("navigation", { name: "public.navigation" });
      expect(
        within(nav)
          .getAllByRole("link")
          .map((link) => link.getAttribute("href")),
      ).toEqual(["/posts", "/works", "/about"]);
    },
  );
  it.each(["/", "/interview"])(
    "should find both articles and notes when searching from %s",
    async (path) => {
      searchPostsFn.mockResolvedValue({ posts: [helloPost], total: 1 });
      searchInterviewNotesFn.mockResolvedValue([
        { slug: "gas", title: "Gas Station", section: "coding" },
      ]);
      await renderRoute(path);
      const input = await openPalette("blog.search.placeholder");
      await typeAndSettle(input, "shared query");
      const results = within(screen.getByRole("dialog"));
      expect(results.getByText("Hello World")).toBeTruthy();
      expect(results.getByText("Gas Station")).toBeTruthy();
      expect(searchPostsFn).toHaveBeenCalledWith({ data: { q: "shared query", limit: 20 } });
      expect(searchInterviewNotesFn).toHaveBeenCalledWith({ data: { q: "shared query" } });
      expect(screen.getByRole("dialog").textContent).not.toMatch(/cd |cat |\.md/);
    },
  );
});
