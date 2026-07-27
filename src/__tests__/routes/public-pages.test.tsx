// @vitest-environment jsdom
//
// The remaining public route components: the two home pages, the tag index and
// tag page, a standalone markdown page, and the post/note detail views. These
// are lighter than the archives — mostly shaping loader data into the terminal
// layout — but each carries at least one conditional that decides whether a
// block renders at all, and every one of those sat uncovered.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { installShellStubs, renderRoute, warmRouteTree } from "../helpers/router";

// See helpers/router for why each of these is load-bearing.
vi.mock("@/lib/og/render", () => ({ renderOgPng: vi.fn() }));
vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtoolsPanel: () => null }));
vi.mock("@/i18n/I18nProvider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));
vi.mock("@/server/locale", () => ({ resolveLocaleFn: async () => "en" }));
vi.mock("@/server/posts", () => ({ searchPostsFn: async () => ({ posts: [], total: 0 }) }));
// The post page mounts Giscus, which injects a script into a live DOM.
vi.mock("@/components/Comments", () => ({ Comments: () => null }));

const homeDataFn = vi.fn();
const tagsDataFn = vi.fn();
const tagDataFn = vi.fn();
const pageDataFn = vi.fn();
const postDataFn = vi.fn();
const interviewDataFn = vi.fn();
const noteDataFn = vi.fn();

vi.mock("@/server/public", () => ({
  blogShellFn: async () => ({
    siteName: "Unconstrained",
    social: { github: null, twitter: null, linkedin: null, email: null },
  }),
  interviewShellFn: async () => ({
    sections: [{ slug: "coding", label: "Coding" }],
    siteName: "Unconstrained",
    social: { github: null, twitter: null, linkedin: null, email: null },
  }),
  searchInterviewNotesFn: async () => ({ notes: [] }),
  homeDataFn: () => homeDataFn(),
  tagsDataFn: () => tagsDataFn(),
  tagDataFn: () => tagDataFn(),
  pageDataFn: () => pageDataFn(),
  postDataFn: () => postDataFn(),
  interviewDataFn: () => interviewDataFn(),
  noteDataFn: () => noteDataFn(),
}));

installShellStubs();

const chrome = { pageTitle: "T", siteName: "Unconstrained" };

beforeAll(warmRouteTree, 60_000);
beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("/ (blog home)", () => {
  it("prints the whoami block and the headline counts", async () => {
    homeDataFn.mockResolvedValue({
      ...chrome,
      whoami: "gary · engineer",
      intro: "Notes on building things.",
      postCount: 12,
      tagCount: 4,
      latestDate: "2025-07-19",
      socialUrls: [],
    });

    await renderRoute("/");

    expect(await screen.findByText(/gary · engineer/)).toBeTruthy();
    expect(screen.getByText("Notes on building things.")).toBeTruthy();
    // The count and its unit share one span, so match the rendered pair.
    expect(screen.getAllByText("12 blog.home.postsUnit").length).toBeGreaterThan(0);
  });

  it("falls back to a default whoami and drops the intro when settings are empty", async () => {
    homeDataFn.mockResolvedValue({
      ...chrome,
      whoami: "",
      intro: "",
      postCount: 0,
      tagCount: 0,
      latestDate: null,
      socialUrls: [],
    });

    await renderRoute("/");

    expect(await screen.findByText(/gary lai/)).toBeTruthy();
    expect(screen.queryByText("Notes on building things.")).toBeNull();
  });
});

describe("/tags", () => {
  it("lists each tag with its post count", async () => {
    tagsDataFn.mockResolvedValue({
      ...chrome,
      tags: [
        { slug: "go", name: "go", count: 3 },
        { slug: "ts", name: "ts", count: 1 },
      ],
    });

    await renderRoute("/tags");

    expect(await screen.findByText("go")).toBeTruthy();
    expect(screen.getByText("ts")).toBeTruthy();
  });

  it("shows the empty state when nothing is tagged yet", async () => {
    tagsDataFn.mockResolvedValue({ ...chrome, tags: [] });

    await renderRoute("/tags");

    expect(await screen.findByText("blog.tags.noneYet")).toBeTruthy();
  });
});

describe("/tags/$slug", () => {
  it("groups the tag's posts by year and lists its interview notes separately", async () => {
    tagDataFn.mockResolvedValue({
      ...chrome,
      tag: { slug: "go", name: "go" },
      posts: [
        { slug: "p1", title: "Post One", date: "2025-03-02", readingTime: 3, tags: [] },
        { slug: "p2", title: "Post Two", date: "2024-01-02", readingTime: 3, tags: [] },
      ],
      notes: [
        {
          slug: "n1",
          title: "Note One",
          sectionSlug: "coding",
          sectionLabel: "Coding",
          date: "2025-05-05",
        },
      ],
    });

    await renderRoute("/tags/go");

    expect(await screen.findByText("Post One")).toBeTruthy();
    expect(screen.getAllByText(/^\.\/\d{4}\/$/).map((e) => e.textContent)).toEqual([
      "./2025/",
      "./2024/",
    ]);
    // Notes get their own block, not a year heading.
    expect(screen.getByText("./interview/")).toBeTruthy();
    expect(screen.getByText("Note One")).toBeTruthy();
  });

  it("omits the interview block for a tag with no notes", async () => {
    tagDataFn.mockResolvedValue({
      ...chrome,
      tag: { slug: "go", name: "go" },
      posts: [{ slug: "p1", title: "Post One", date: "2025-03-02", readingTime: 3, tags: [] }],
      notes: [],
    });

    await renderRoute("/tags/go");

    await screen.findByText("Post One");
    expect(screen.queryByText("./interview/")).toBeNull();
  });
});

describe("/$slug (standalone page)", () => {
  it("renders the page title and its rendered markdown", async () => {
    pageDataFn.mockResolvedValue({
      ...chrome,
      page: { slug: "about", title: "About" },
      html: "<p>Hello from the about page.</p>",
      description: "",
    });

    await renderRoute("/about");

    expect(await screen.findByText("About")).toBeTruthy();
    expect(screen.getByText("Hello from the about page.")).toBeTruthy();
  });
});

describe("/posts/$slug", () => {
  const basePost = {
    slug: "hello",
    title: "Hello World",
    date: "2025-07-19",
    readingTime: 5,
    tags: [{ slug: "go", name: "go" }],
    excerpt: null,
    coverImageUrl: null,
  };

  it("renders the front-matter block, body and tag links", async () => {
    postDataFn.mockResolvedValue({
      ...chrome,
      post: basePost,
      html: "<p>The body.</p>",
      toc: [],
      adjacent: { prev: null, next: null },
      giscus: null,
      description: "",
    });

    await renderRoute("/posts/hello");

    expect(await screen.findByText("Hello World")).toBeTruthy();
    expect(screen.getByText("The body.")).toBeTruthy();
    expect(screen.getByText("#go")).toBeTruthy();
  });

  it("hides the tag row for an untagged post", async () => {
    postDataFn.mockResolvedValue({
      ...chrome,
      post: { ...basePost, tags: [] },
      html: "<p>The body.</p>",
      toc: [],
      adjacent: { prev: null, next: null },
      giscus: null,
      description: "",
    });

    await renderRoute("/posts/hello");

    await screen.findByText("Hello World");
    expect(screen.queryByText("blog.post.tagsLabel")).toBeNull();
  });

  it("links to the neighbouring posts when there are any", async () => {
    postDataFn.mockResolvedValue({
      ...chrome,
      post: basePost,
      html: "<p>The body.</p>",
      toc: [],
      adjacent: {
        prev: { slug: "older", title: "Older Post" },
        next: { slug: "newer", title: "Newer Post" },
      },
      giscus: null,
      description: "",
    });

    await renderRoute("/posts/hello");

    expect(await screen.findByText(/Older Post/)).toBeTruthy();
    expect(screen.getByText(/Newer Post/)).toBeTruthy();
  });
});

describe("/interview", () => {
  it("sums the notes across sections and lists each section", async () => {
    interviewDataFn.mockResolvedValue({
      ...chrome,
      sections: [
        { slug: "coding", label: "Coding", blurb: "algorithms", count: 7, icon: null },
        { slug: "system", label: "System", blurb: "design", count: 3, icon: null },
      ],
      recent: [
        {
          slug: "n1",
          title: "Recent Note",
          section: "coding",
          date: "2025-06-01",
          minutes: 4,
          tags: [],
        },
      ],
    });

    await renderRoute("/interview");

    expect(await screen.findByText("./coding")).toBeTruthy();
    expect(screen.getByText("./system")).toBeTruthy();
    // 7 + 3 across the two sections.
    expect(screen.getByText("10 blog.interview.notesUnit")).toBeTruthy();
    expect(screen.getByText("Recent Note")).toBeTruthy();
  });

  it("drops the recent block when there are no notes at all", async () => {
    interviewDataFn.mockResolvedValue({ ...chrome, sections: [], recent: [] });

    await renderRoute("/interview");

    expect(await screen.findByText("blog.interview.title")).toBeTruthy();
    expect(screen.queryByText("Recent Note")).toBeNull();
  });
});

describe("/interview/$section/$slug", () => {
  it("renders the note body and its tag links", async () => {
    noteDataFn.mockResolvedValue({
      ...chrome,
      note: {
        slug: "gas",
        section: "coding",
        sectionLabel: "Coding",
        title: "134. Gas Station",
        date: "2025-06-01",
        updatedAt: "2025-06-02",
        minutes: 6,
        tags: [{ slug: "greedy", name: "greedy" }],
      },
      html: "<p>Walk the tank.</p>",
      toc: [],
    });

    await renderRoute("/interview/coding/gas");

    expect(await screen.findByText("134. Gas Station")).toBeTruthy();
    expect(screen.getByText("Walk the tank.")).toBeTruthy();
    expect(screen.getByText("#greedy")).toBeTruthy();
  });
});
