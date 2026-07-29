// @vitest-environment jsdom
//
// The /works index and /works/$slug detail routes. Both are pure presentation
// over their loader data — ordering is done in SQL, so what these assert is the
// rendering decisions: the `./slug/` label shape, the year-range meta, the
// conditional frontmatter lines, and the external links.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
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

const worksDataFn = vi.fn();
const workDataFn = vi.fn();
vi.mock("@/server/public", () => ({
  blogShellFn: async () => ({
    siteName: "Unconstrained",
    social: { github: null, twitter: null, linkedin: null, email: null },
  }),
  worksDataFn: () => worksDataFn(),
  workDataFn: (arg: unknown) => workDataFn(arg),
}));

installShellStubs();

function work(slug: string, extra: Record<string, unknown> = {}) {
  return {
    slug,
    title: `Work ${slug}`,
    summary: `Summary of ${slug}`,
    coverImageUrl: null,
    projectUrl: null,
    repoUrl: null,
    role: null,
    year: 2025,
    endYear: null,
    date: "2025-01-01",
    updatedAt: "2025-01-02",
    pinned: false,
    tags: [],
    ...extra,
  };
}

function withWorks(works: unknown[]) {
  worksDataFn.mockResolvedValue({ works, pageTitle: "Works", siteName: "Unconstrained" });
}

function withWork(w: Record<string, unknown>, html = "<p>case study</p>") {
  workDataFn.mockResolvedValue({
    work: w,
    html,
    description: "d",
    pageTitle: w.title,
    siteName: "Unconstrained",
  });
}

beforeAll(warmRouteTree, 60_000);
beforeEach(() => {
  vi.clearAllMocks();
  withWorks([]);
});
afterEach(() => cleanup());

describe("/works", () => {
  it("renders one row per work with its slug label, summary and year", async () => {
    withWorks([work("laigary-com", { summary: "personal site", year: 2025 })]);

    await renderRoute("/works");

    expect(await screen.findByText("./laigary-com/")).toBeTruthy();
    expect(screen.getByText("personal site")).toBeTruthy();
    expect(screen.getByText("2025")).toBeTruthy();
  });

  it("renders a multi-year work as a range", async () => {
    withWorks([work("ranged", { year: 2021, endYear: 2023 })]);

    await renderRoute("/works");

    expect(await screen.findByText("2021–2023")).toBeTruthy();
  });

  it("marks a pinned work in its meta cell", async () => {
    withWorks([work("pinned-one", { pinned: true, year: 2019 })]);

    await renderRoute("/works");

    // Rows arrive already ordered pinned-first, so the star explains the
    // ordering rather than being the only signal it happened.
    expect(await screen.findByText("★ 2019")).toBeTruthy();
  });

  it("says so when there are no works rather than rendering an empty list", async () => {
    withWorks([]);

    await renderRoute("/works");

    expect(await screen.findByText("blog.works.noneYet")).toBeTruthy();
  });

  it("opens a work when its row is clicked", async () => {
    withWorks([work("target")]);
    withWork(work("target"));

    const { router } = await renderRoute("/works");
    fireEvent.click(await screen.findByText("./target/"));

    await waitFor(() => expect(router.state.location.pathname).toBe("/works/target"));
  });
});

describe("/works/$slug", () => {
  it("renders the case study body and the work's title", async () => {
    withWork(work("full", { title: "Full Work" }), "<p>the case study</p>");

    await renderRoute("/works/full");

    expect(await screen.findByRole("heading", { name: "Full Work" })).toBeTruthy();
    expect(screen.getByText("the case study")).toBeTruthy();
  });

  it("falls back to the summary when a work has no write-up", async () => {
    // contentMd defaults to "" in the schema, so a work can ship as a link and
    // a summary. Rendering an empty Prose would leave the page blank.
    withWork(work("bare", { summary: "just a one-liner" }), "");

    await renderRoute("/works/bare");

    expect(await screen.findByText("just a one-liner")).toBeTruthy();
  });

  it("lists role, stack and links in the frontmatter block when present", async () => {
    withWork(
      work("rich", {
        role: "Solo · design + build",
        year: 2021,
        endYear: 2023,
        projectUrl: "https://example.com",
        repoUrl: "https://github.com/x/y",
        tags: [{ name: "go", slug: "go" }],
      }),
    );

    await renderRoute("/works/rich");

    const pre = (await screen.findByText(/^---/)).textContent ?? "";
    expect(pre).toContain("year:   2021–2023");
    expect(pre).toContain("role:   Solo · design + build");
    expect(pre).toContain("stack:  [go]");
    expect(pre).toContain("live:   https://example.com");
    expect(pre).toContain("repo:   https://github.com/x/y");
  });

  it("omits the frontmatter lines a work has no value for", async () => {
    // A site with no public repo must not advertise a blank `repo:` — this is
    // the case the conditional lines exist for.
    withWork(work("sparse"));

    await renderRoute("/works/sparse");

    const pre = (await screen.findByText(/^---/)).textContent ?? "";
    expect(pre).toContain("year:   2025");
    expect(pre).not.toContain("role:");
    expect(pre).not.toContain("stack:");
    expect(pre).not.toContain("live:");
    expect(pre).not.toContain("repo:");
  });

  it("links out to the live site and the repository", async () => {
    withWork(
      work("linked", { projectUrl: "https://example.com", repoUrl: "https://github.com/x/y" }),
    );

    await renderRoute("/works/linked");

    const live = (await screen.findByText(/\$ open/)).closest("a")!;
    expect(live.getAttribute("href")).toBe("https://example.com");
    expect(live.getAttribute("rel")).toBe("noreferrer");
    const repo = screen.getByText(/\$ git clone/).closest("a")!;
    expect(repo.getAttribute("href")).toBe("https://github.com/x/y");
  });

  it("renders no link block for a work with neither url", async () => {
    withWork(work("nolinks"));

    await renderRoute("/works/nolinks");

    await screen.findByRole("heading", { name: "Work nolinks" });
    expect(screen.queryByText(/\$ open/)).toBeNull();
    expect(screen.queryByText(/\$ git clone/)).toBeNull();
  });

  it("404s a slug the loader cannot resolve", async () => {
    // A draft or a deleted work must not render a page bound to null.
    workDataFn.mockResolvedValue(null);
    const options = (await import("@/routes/_site/works/$slug")).Route.options as unknown as {
      loader: (arg: { params: { slug: string } }) => Promise<unknown>;
    };

    await expect(options.loader({ params: { slug: "gone" } })).rejects.toBeDefined();
  });
});

// `head` is a plain function on Route.options, so it needs no router. What it
// decides is the share card and the structured data — neither of which any
// rendering assertion above can see.
describe("/works/$slug head", () => {
  type HeadOut = {
    meta: Record<string, string>[];
    links: unknown[];
    scripts: { children: string }[];
  };

  async function head(loaderData: unknown): Promise<HeadOut> {
    const options = (await import("@/routes/_site/works/$slug")).Route.options as unknown as {
      head: (arg: { loaderData: unknown }) => HeadOut;
    };
    return options.head({ loaderData });
  }

  function loaded(w: Record<string, unknown>) {
    return { work: w, html: "", description: "d", pageTitle: "T", siteName: "Unconstrained" };
  }

  const ogImage = (out: HeadOut) =>
    out.meta.find((m) => m.property === "og:image")?.content ??
    out.meta.find((m) => m.name === "og:image")?.content;

  it("falls back to the generated card when a work has no cover image", async () => {
    const out = await head(loaded(work("nocover")));

    expect(ogImage(out)).toBe("https://laigary.com/api/og/works/nocover");
  });

  it("prefers the uploaded cover image when there is one", async () => {
    const out = await head(
      loaded(work("withcover", { coverImageUrl: "https://cdn.example.com/a.png" })),
    );

    expect(ogImage(out)).toBe("https://cdn.example.com/a.png");
  });

  it("omits og:description entirely rather than emitting an empty one", async () => {
    // `|| undefined`, not `??` — a work with no summary and no write-up yields
    // "", and an empty og:description is worse than none at all.
    const out = await head({ ...loaded(work("nodesc")), description: "" });

    expect(out.meta.find((m) => m.property === "og:description")).toBeUndefined();
  });

  it("emits CreativeWork structured data carrying the editorial year", async () => {
    const out = await head(loaded(work("rich", { year: 2021, endYear: 2023 })));
    const ld = JSON.parse(out.scripts[0].children);

    expect(ld["@type"]).toBe("CreativeWork");
    // dateCreated is the year the thing was made, not when the entry went up.
    expect(ld.dateCreated).toBe("2021");
    expect(ld.url).toBe("https://laigary.com/works/rich");
  });

  it("emits nothing rather than throwing before the loader has resolved", async () => {
    // head runs against undefined loaderData on the way in; a bare property
    // access here would take the whole route down.
    const out = await head(undefined);

    expect(out.meta).toEqual([]);
    expect(out.scripts).toEqual([]);
    expect(out.links).toEqual([]);
  });
});
