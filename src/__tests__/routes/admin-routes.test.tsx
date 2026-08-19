// @vitest-environment happy-dom
//
// The /admin route wrappers. AGENTS.md used to say these stay uncovered because
// "the components they mount are tested directly" — true of the components, but
// it left the wrappers' own decisions untested, and they make three that the
// component tests cannot see: the three edit routes turn a missing row into a
// notFound() (get that wrong and a deleted post renders a form bound to
// `undefined`), /admin/interview redirects rather than rendering, and /admin
// declares `noindex, nofollow` — the only thing keeping the CMS out of search
// results, since the route itself is public and access is enforced at the edge.
//
// Loaders and `head` are plain functions on `Route.options` and are called
// directly. The components need a live router, so they go through the generated
// tree the same way the public route tests do.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { installShellStubs, renderRoute, warmRouteTree } from "../helpers/router";
import { ADMIN_BREADCRUMB_KEYS } from "@/components/admin/admin-location";

// See helpers/router for why each of these is load-bearing.
vi.mock("@/lib/og/render", () => ({ renderOgPng: vi.fn() }));
vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtoolsPanel: () => null }));
vi.mock("@/i18n/I18nProvider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));
vi.mock("@/server/locale", () => ({ resolveLocaleFn: async () => "en" }));

// The editor is lazy, client-only and drags in the whole Tiptap chunk; what the
// wrappers do with it is hand a form some loader data.
vi.mock("@/components/admin/TiptapEditor", () => ({
  TiptapEditor: ({ value }: { value: string }) => (
    <textarea aria-label="body" defaultValue={value} />
  ),
}));

const reads = vi.hoisted(() => ({
  dashboardStatsFn: vi.fn(),
  listPostsFn: vi.fn(),
  listTagsFn: vi.fn(),
  listPagesFn: vi.fn(),
  listNotesFn: vi.fn(),
  listSectionsFn: vi.fn(),
  getSettingsFn: vi.fn(),
  getPageFn: vi.fn(),
  newPostDataFn: vi.fn(),
  editPostDataFn: vi.fn(),
  listWorksFn: vi.fn(),
  newWorkDataFn: vi.fn(),
  editWorkDataFn: vi.fn(),
  newNoteDataFn: vi.fn(),
  editNoteDataFn: vi.fn(),
  searchLinkTargetsFn: vi.fn(),
}));
vi.mock("@/server/admin/reads", () => reads);

installShellStubs();

const HOUR_AGO = Math.floor(Date.now() / 1000) - 3600;

const post = {
  id: "p1",
  slug: "hello",
  title: "Hello World",
  contentMd: "# hi",
  excerpt: "",
  coverImageUrl: "",
  tagIds: [],
  status: "published" as const,
  pinned: false,
};

const work = {
  id: "w1",
  slug: "portfolio",
  title: "Portfolio Piece",
  summary: "one liner",
  contentMd: "# hi",
  coverImageUrl: null,
  projectUrl: null,
  repoUrl: null,
  role: null,
  year: 2021,
  endYear: 2023,
  status: "published" as const,
  pinned: false,
  tagIds: [],
};

const note = {
  id: "n1",
  slug: "two-sum",
  sectionId: "s1",
  title: "Two Sum",
  contentMd: "# hi",
  status: "published" as const,
  pinned: false,
  tagIds: [],
};

/** Every loader answers with something valid; each test overrides what it asserts on. */
beforeEach(() => {
  reads.dashboardStatsFn.mockResolvedValue({
    postsPublished: 0,
    postsDrafts: 0,
    postsTotal: 0,
    notes: 0,
    works: 0,
    pages: 0,
    tags: 0,
  });
  reads.listPostsFn.mockResolvedValue([]);
  reads.listTagsFn.mockResolvedValue([]);
  reads.listPagesFn.mockResolvedValue([]);
  reads.listNotesFn.mockResolvedValue({ items: [], total: 0, pageSize: 20 });
  reads.listSectionsFn.mockResolvedValue([]);
  reads.getSettingsFn.mockResolvedValue({});
  reads.getPageFn.mockResolvedValue({ id: "g1", slug: "about", title: "About", contentMd: "" });
  reads.newPostDataFn.mockResolvedValue({ tags: [], ogBrand: "Unconstrained" });
  reads.editPostDataFn.mockResolvedValue({ post, tags: [], ogBrand: "Unconstrained" });
  reads.listWorksFn.mockResolvedValue([]);
  reads.newWorkDataFn.mockResolvedValue({ tags: [], ogBrand: "Unconstrained" });
  reads.editWorkDataFn.mockResolvedValue({ work, tags: [], ogBrand: "Unconstrained" });
  reads.newNoteDataFn.mockResolvedValue({ sections: [], tags: [] });
  reads.editNoteDataFn.mockResolvedValue({ note, sections: [], tags: [] });
  reads.searchLinkTargetsFn.mockResolvedValue([]);
});

beforeAll(warmRouteTree, 60_000);
afterEach(() => cleanup());

/** Load the route module and hand back its `Route.options`, typed loosely. */
async function optionsOf(path: string) {
  const mod = (await import(/* @vite-ignore */ `@/routes/${path}`)) as {
    Route: { options: Record<string, (arg: never) => unknown> };
  };
  return mod.Route.options;
}

describe("/admin layout", () => {
  it("keeps the whole admin out of search results", async () => {
    // The route is publicly routable — Cloudflare Access gates it at the edge,
    // not in-app — so this meta tag is all that stops the CMS being indexed.
    const options = await optionsOf("admin/route");
    const head = options.head(undefined as never) as { meta: Record<string, string>[] };

    expect(head.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
  });

  it("wraps the page in the admin chrome", async () => {
    await renderRoute("/admin");

    // Sidebar nav and header both render around the outlet.
    expect(await screen.findByText("admin.menu")).toBeTruthy();
    expect(screen.getAllByText("admin.dashboard").length).toBeGreaterThan(0);
  });
});

describe("admin tab titles", () => {
  // Every admin page used to inherit the layout's bare "Admin", so a row of
  // open editors was unreadable — the tab is the only thing telling two post
  // editors apart. Each route now names itself, and the editors lead with the
  // entity they loaded.
  const TITLES: Array<[module: string, fullPath: string, expected: string, loaderData?: unknown]> =
    [
      ["admin/index", "/admin/", "Dashboard · Admin"],
      ["admin/posts/index", "/admin/posts/", "Posts · Admin"],
      ["admin/posts/new", "/admin/posts/new", "New Post · Admin"],
      [
        "admin/posts/$postId/edit",
        "/admin/posts/$postId/edit",
        "Hello World · Edit Post · Admin",
        { post },
      ],
      ["admin/works/index", "/admin/works/", "Works · Admin"],
      ["admin/works/new", "/admin/works/new", "New Work · Admin"],
      [
        "admin/works/$workId/edit",
        "/admin/works/$workId/edit",
        "Portfolio Piece · Edit Work · Admin",
        { work },
      ],
      ["admin/pages/index", "/admin/pages/", "Pages · Admin"],
      ["admin/pages/new", "/admin/pages/new", "New Page · Admin"],
      [
        "admin/pages/$slug/edit",
        "/admin/pages/$slug/edit",
        "About · Edit Page · Admin",
        { slug: "about", title: "About", contentMd: "" },
      ],
      ["admin/interview/sections", "/admin/interview/sections", "Interview Sections · Admin"],
      ["admin/interview/notes/index", "/admin/interview/notes/", "Interview Notes · Admin"],
      ["admin/interview/notes/new", "/admin/interview/notes/new", "New Note · Admin"],
      [
        "admin/interview/notes/$noteId/edit",
        "/admin/interview/notes/$noteId/edit",
        "Two Sum · Edit Note · Admin",
        { note },
      ],
      ["admin/tags", "/admin/tags", "Tags · Admin"],
      ["admin/settings", "/admin/settings", "Settings · Admin"],
    ];

  it.each(TITLES)("titles %s", async (module, fullPath, expected, loaderData) => {
    const options = await optionsOf(module);
    const head = options.head({ match: { fullPath }, loaderData } as never) as {
      meta: Record<string, string>[];
    };

    expect(head.meta).toContainEqual({ title: expected });
  });

  it("titles every admin route that renders", async () => {
    // The map is exhaustive by type, so a route added later shows up here as a
    // missing case rather than as another tab reading "Admin".
    const rendering = Object.keys(ADMIN_BREADCRUMB_KEYS).filter(
      // The layout is never the leaf, and /admin/interview only redirects.
      (path) => path !== "/admin" && path !== "/admin/interview/",
    );

    expect(TITLES.map(([, fullPath]) => fullPath).sort()).toEqual(rendering.sort());
  });

  it("falls back to the section name for an untitled draft", async () => {
    // A post saved before it is named would otherwise render " · Edit Post".
    const options = await optionsOf("admin/posts/$postId/edit");
    const head = options.head({
      match: { fullPath: "/admin/posts/$postId/edit" },
      loaderData: { post: { ...post, title: "" } },
    } as never) as { meta: Record<string, string>[] };

    expect(head.meta).toContainEqual({ title: "Edit Post · Admin" });
  });
});

describe("/admin/ (dashboard)", () => {
  it("renders the counts its loader fetched", async () => {
    reads.dashboardStatsFn.mockResolvedValue({
      postsPublished: 7,
      postsDrafts: 2,
      postsTotal: 9,
      notes: 4,
      works: 6,
      pages: 3,
      tags: 5,
    });

    await renderRoute("/admin");

    expect(await screen.findByText("9")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });
});

describe("/admin/posts", () => {
  it("lists the posts its loader fetched", async () => {
    reads.listPostsFn.mockResolvedValue([
      {
        id: "p1",
        slug: "live",
        title: "Live post",
        status: "published",
        pinned: false,
        updatedAt: HOUR_AGO,
      },
    ]);

    await renderRoute("/admin/posts");

    expect(await screen.findByText("Live post")).toBeTruthy();
  });

  it("keeps ?status out of search when it is not a real status", async () => {
    const options = await optionsOf("admin/posts/index");
    const parsed = options.validateSearch({ q: "go", status: "archived" } as never);

    expect(parsed).toEqual({ q: "go", page: undefined, status: undefined });
  });

  it("opens an empty editor at /admin/posts/new", async () => {
    reads.newPostDataFn.mockResolvedValue({ tags: [], ogBrand: "Brand" });

    await renderRoute("/admin/posts/new");

    const title = (await screen.findByLabelText("postForm.title")) as HTMLInputElement;
    expect(title.value).toBe("");
  });

  it("loads the post into the editor at /admin/posts/$postId/edit", async () => {
    await renderRoute("/admin/posts/p1/edit");

    const title = (await screen.findByLabelText("postForm.title")) as HTMLInputElement;
    expect(title.value).toBe("Hello World");
    expect(reads.editPostDataFn).toHaveBeenCalledWith({ data: { id: "p1" } });
  });

  it("404s the editor for a post that no longer exists", async () => {
    // Without the guard the component renders a form bound to `undefined`.
    reads.editPostDataFn.mockResolvedValue({ post: null, tags: [], ogBrand: "" });
    const options = await optionsOf("admin/posts/$postId/edit");

    await expect(options.loader({ params: { postId: "gone" } } as never)).rejects.toBeDefined();
  });
});

describe("/admin/works", () => {
  it("lists the works its loader fetched", async () => {
    reads.listWorksFn.mockResolvedValue([
      {
        id: "w1",
        slug: "live",
        title: "Live work",
        status: "published",
        pinned: false,
        year: 2025,
        updatedAt: HOUR_AGO,
      },
    ]);

    await renderRoute("/admin/works");

    expect(await screen.findByText("Live work")).toBeTruthy();
  });

  it("keeps ?status out of search when it is not a real status", async () => {
    const options = await optionsOf("admin/works/index");
    const parsed = options.validateSearch({ q: "go", status: "archived" } as never);

    expect(parsed).toEqual({ q: "go", page: undefined, status: undefined });
  });

  it("opens an empty editor at /admin/works/new", async () => {
    reads.newWorkDataFn.mockResolvedValue({ tags: [], ogBrand: "Brand" });

    await renderRoute("/admin/works/new");

    const title = (await screen.findByLabelText("postForm.title")) as HTMLInputElement;
    expect(title.value).toBe("");
  });

  it("loads the work into the editor at /admin/works/$workId/edit", async () => {
    await renderRoute("/admin/works/w1/edit");

    const title = (await screen.findByLabelText("postForm.title")) as HTMLInputElement;
    expect(title.value).toBe("Portfolio Piece");
    expect(reads.editWorkDataFn).toHaveBeenCalledWith({ data: { id: "w1" } });
  });

  it("404s the editor for a work that no longer exists", async () => {
    // Without the guard the component renders a form bound to `undefined`.
    reads.editWorkDataFn.mockResolvedValue({ work: null, tags: [], ogBrand: "" });
    const options = await optionsOf("admin/works/$workId/edit");

    await expect(options.loader({ params: { workId: "gone" } } as never)).rejects.toBeDefined();
  });
});

describe("/admin/pages", () => {
  it("lists the pages its loader fetched", async () => {
    reads.listPagesFn.mockResolvedValue([
      { id: "g1", slug: "about", title: "About", updatedAt: HOUR_AGO },
    ]);

    await renderRoute("/admin/pages");

    expect(await screen.findByText("About")).toBeTruthy();
  });

  it("opens an empty editor at /admin/pages/new", async () => {
    // This route has no loader at all — the wrapper's whole job is to mount the
    // form with no `page`, which is what puts it in create mode.
    await renderRoute("/admin/pages/new");

    const title = (await screen.findByLabelText("pageForm.title")) as HTMLInputElement;
    expect(title.value).toBe("");
    expect(screen.queryByText("admin.editPage")).toBeNull();
  });

  it("loads the page into the editor at /admin/pages/$slug/edit", async () => {
    reads.getPageFn.mockResolvedValue({
      id: "g1",
      slug: "about",
      title: "About Me",
      contentMd: "hi",
    });

    await renderRoute("/admin/pages/about/edit");

    const title = (await screen.findByLabelText("pageForm.title")) as HTMLInputElement;
    expect(title.value).toBe("About Me");
  });

  it("404s the editor for a page that does not exist", async () => {
    reads.getPageFn.mockResolvedValue(null);
    const options = await optionsOf("admin/pages/$slug/edit");

    await expect(options.loader({ params: { slug: "nope" } } as never)).rejects.toBeDefined();
  });
});

describe("/admin/tags", () => {
  it("lists the tags its loader fetched", async () => {
    reads.listTagsFn.mockResolvedValue([
      { id: "t1", name: "Go", slug: "go", postCount: 2, noteCount: 0, usedBy: [] },
    ]);

    await renderRoute("/admin/tags");

    expect(await screen.findByText("Go")).toBeTruthy();
  });
});

describe("/admin/settings", () => {
  it("fills the form from the stored settings", async () => {
    reads.getSettingsFn.mockResolvedValue({ site_name: "Unconstrained" });

    await renderRoute("/admin/settings");

    const field = (await screen.findByLabelText("admin.siteName")) as HTMLInputElement;
    expect(field.value).toBe("Unconstrained");
  });
});

describe("/admin/interview", () => {
  it("sends the bare URL to the notes list rather than rendering", async () => {
    // The parent entry in the sidebar points here; it has no page of its own.
    const options = await optionsOf("admin/interview/index");

    expect(() => options.beforeLoad(undefined as never)).toThrow();
  });

  it("lists the sections its loader fetched", async () => {
    reads.listSectionsFn.mockResolvedValue([
      {
        id: "s1",
        slug: "arrays",
        label: "Arrays",
        blurb: "",
        icon: "",
        sortOrder: 1,
        noteCount: 3,
      },
    ]);

    await renderRoute("/admin/interview/sections");

    expect(await screen.findByText("Arrays")).toBeTruthy();
  });

  it("lists the notes its loader fetched", async () => {
    reads.listNotesFn.mockResolvedValue({
      items: [
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
      ],
      total: 1,
      pageSize: 20,
      sections: [{ id: "s1", label: "Arrays", slug: "arrays" }],
    });

    await renderRoute("/admin/interview/notes");

    expect(await screen.findByText("Two Sum")).toBeTruthy();
  });

  it("opens an empty editor at /admin/interview/notes/new", async () => {
    reads.newNoteDataFn.mockResolvedValue({
      sections: [{ id: "s1", label: "Arrays", slug: "arrays" }],
      tags: [],
    });

    await renderRoute("/admin/interview/notes/new");

    const title = (await screen.findByLabelText("noteForm.title")) as HTMLInputElement;
    expect(title.value).toBe("");
  });

  it("loads the note into the editor at /admin/interview/notes/$noteId/edit", async () => {
    reads.editNoteDataFn.mockResolvedValue({
      note,
      sections: [{ id: "s1", label: "Arrays", slug: "arrays" }],
      tags: [],
    });

    await renderRoute("/admin/interview/notes/n1/edit");

    const title = (await screen.findByLabelText("noteForm.title")) as HTMLInputElement;
    expect(title.value).toBe("Two Sum");
    expect(reads.editNoteDataFn).toHaveBeenCalledWith({ data: { id: "n1" } });
  });

  it("404s the editor for a note that no longer exists", async () => {
    reads.editNoteDataFn.mockResolvedValue({ note: null, sections: [], tags: [] });
    const options = await optionsOf("admin/interview/notes/$noteId/edit");

    await expect(options.loader({ params: { noteId: "gone" } } as never)).rejects.toBeDefined();
  });
});
