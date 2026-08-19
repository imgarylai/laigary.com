// @vitest-environment happy-dom
//
// The /interview/$section listing. Paging, the `?tag=` filter and the
// pinned/chronological split are the SERVER's job now (the page used to hold
// all 500 notes and slice them in the browser, which is what made the section
// query the most expensive one on the site) — those rules are pinned in
// server/public-impl. What is left here is the half that stayed client-side:
// that the component renders the page it is handed, and that the URL state it
// owns reaches the loader intact.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
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

// searchInterviewNotesFn returns a BARE ARRAY. Both files used to mock it as
// `{ notes: [] }` — a contract that never existed (#208). The handle is typed
// against the real awaited return type, so a fixture that drifts back to an
// object shape fails `pnpm typecheck`. The palette closure that consumes it is
// no longer excluded from route coverage either — `routes/layout-palettes`
// drives it for real — so the shape is now pinned from both ends.
//
// `Partial<typeof import("@/server/public")>` on the factory does NOT work:
// createServerFn returns an OptionalFetcher carrying [TSS_SERVER_FUNCTION],
// url, method and __executeServer, so a plain arrow is unassignable and even a
// CORRECT mock fails to compile. Pinning the return type is the part that bites.
type NotesSearchResult = Awaited<
  ReturnType<(typeof import("@/server/public"))["searchInterviewNotesFn"]>
>;
const { searchInterviewNotes } = vi.hoisted(() => ({
  searchInterviewNotes: vi.fn<(opts: { data: { q: string } }) => Promise<NotesSearchResult>>(
    async () => [],
  ),
}));

// Takes the argument object so the tests can assert what the loader forwards —
// `page` and `tag` are the whole reason the loader has deps now.
const sectionDataFn = vi.fn();
vi.mock("@/server/public", () => ({
  interviewShellFn: async () => ({
    sections: [{ slug: "coding", label: "Coding" }],
    siteName: "Unconstrained",
    social: { github: null, twitter: null, linkedin: null, email: null },
  }),
  searchInterviewNotesFn: searchInterviewNotes,
  sectionDataFn: (opts: unknown) => sectionDataFn(opts),
}));

installShellStubs();

const PAGE_SIZE = 20;

function note(slug: string, date: string) {
  return { slug, title: `Note ${slug}`, date, minutes: 4 };
}

type SectionOverrides = {
  tags?: string[];
  blurb?: string | null;
  pinned?: ReturnType<typeof note>[];
  page?: number;
  total?: number;
};

// Stands in for one already-paginated response. `total` defaults to the number
// of rows handed over, i.e. "this is the only page".
function withSection(notes: ReturnType<typeof note>[], over: SectionOverrides = {}) {
  sectionDataFn.mockResolvedValue({
    pageTitle: "Coding",
    siteName: "Unconstrained",
    section: { slug: "coding", label: "Coding", blurb: over.blurb ?? null },
    tags: over.tags ?? [],
    notes,
    pinned: over.pinned ?? [],
    page: over.page ?? 1,
    pageSize: PAGE_SIZE,
    total: over.total ?? notes.length,
  });
}

/** A full page of 20 rows, with a 22-row total behind it. */
function fullFirstPage() {
  return Array.from({ length: PAGE_SIZE }, (_, i) =>
    note(`n${String(i).padStart(2, "0")}`, `2025-06-${String((i % 28) + 1).padStart(2, "0")}`),
  );
}

// Charge the route-tree import to a hook, not to whichever test renders
// first — under coverage it alone exceeds the default 5s test timeout.
beforeAll(warmRouteTree, 60_000);
beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("/interview/$section", () => {
  it("renders the section heading and its blurb", async () => {
    withSection([note("a", "2025-03-02")], { blurb: "How I practise algorithms." });

    await renderRoute("/interview/coding");

    expect(await screen.findByText("Coding")).toBeTruthy();
    expect(screen.getByText("How I practise algorithms.")).toBeTruthy();
  });

  it("omits the blurb paragraph when the section has none", async () => {
    withSection([note("a", "2025-03-02")]);

    await renderRoute("/interview/coding");

    await screen.findByText("Note a");
    expect(screen.queryByText("How I practise algorithms.")).toBeNull();
  });

  it("groups notes by year, newest year first", async () => {
    withSection([note("a", "2025-03-02"), note("b", "2023-11-09"), note("c", "2024-08-21")]);

    await renderRoute("/interview/coding");

    await screen.findByText("Note a");
    expect(screen.getAllByText(/^\.\/\d{4}\/$/).map((el) => el.textContent)).toEqual([
      "./2025/",
      "./2024/",
      "./2023/",
    ]);
  });

  it("renders the pinned block above the year list", async () => {
    withSection([note("plain", "2025-02-02")], { pinned: [note("pin", "2025-01-01")] });

    await renderRoute("/interview/coding");

    await screen.findByText("./pinned/");
    // Once, in the pinned block — the server keeps it out of the paged list.
    expect(screen.getAllByText("Note pin")).toHaveLength(1);
    expect(screen.getByText("Note plain")).toBeTruthy();
  });

  it("omits the pinned block when the server sends none", async () => {
    withSection([note("plain", "2025-02-02")]);

    await renderRoute("/interview/coding");

    await screen.findByText("Note plain");
    expect(screen.queryByText("./pinned/")).toBeNull();
  });

  it("should forward the page and tag from the URL to the loader", async () => {
    withSection([note("dp", "2025-05-05")], { tags: ["dynamic programming"], page: 2, total: 22 });

    await renderRoute("/interview/coding?page=2&tag=dynamic%20programming");

    await screen.findByText("Note dp");
    expect(sectionDataFn).toHaveBeenCalledWith({
      data: { slug: "coding", page: 2, tag: "dynamic programming" },
    });
  });

  it("should send no page or tag when the URL carries neither", async () => {
    withSection([note("a", "2025-03-02")]);

    await renderRoute("/interview/coding");

    await screen.findByText("Note a");
    expect(sectionDataFn).toHaveBeenCalledWith({
      data: { slug: "coding", page: undefined, tag: undefined },
    });
  });

  it("should size the pager from the server's total, not the rows on screen", async () => {
    withSection(fullFirstPage(), { total: 22 });

    await renderRoute("/interview/coding");

    await screen.findByText("Note n00");
    // 22 rows over a 20-row page is two pages; only the first 20 are here.
    expect(screen.getByRole("button", { name: "2" })).toBeTruthy();
    expect(screen.getByText("Note n19")).toBeTruthy();
    expect(screen.queryByText("Note n20")).toBeNull();
  });

  it("should follow the server's page number when it differs from the URL", async () => {
    // What a `?page=99` past the end resolves to: the server clamps and says
    // which page it actually returned, and the pager has to believe it.
    withSection([note("n20", "2025-06-21"), note("n21", "2025-06-22")], { page: 2, total: 22 });

    await renderRoute("/interview/coding?page=99");

    expect(await screen.findByText("Note n20")).toBeTruthy();
    expect(screen.getByText("Note n21")).toBeTruthy();
    // Page 2 is the one marked current, even though the URL said 99.
    expect(screen.getByRole("button", { name: "2" }).className).toContain("border-tm-accent");
  });

  it("renders the filter chips and marks the active one", async () => {
    withSection([note("a", "2025-03-02")], { tags: ["graphs", "trees"] });

    await renderRoute("/interview/coding?tag=graphs");

    const active = await screen.findByText("#graphs");
    expect(active.className).toContain("border-tm-accent");
    // `all` clears the filter and is inactive while a tag is applied.
    expect(screen.getByText("all").className).toContain("text-tm-muted");
  });

  it("marks `all` active when no tag is applied", async () => {
    withSection([note("a", "2025-03-02")], { tags: ["graphs"] });

    await renderRoute("/interview/coding");

    const all = await screen.findByText("all");
    expect(all.className).toContain("border-tm-accent");
  });

  it("hides the filter row entirely when the section has no tags", async () => {
    withSection([note("a", "2025-03-02")]);

    await renderRoute("/interview/coding");

    await screen.findByText("Note a");
    expect(screen.queryByText("all")).toBeNull();
  });

  it("shows the empty state when a tag matches nothing", async () => {
    withSection([], { tags: ["graphs"] });

    await renderRoute("/interview/coding?tag=trees");

    expect(await screen.findByText("blog.interview.noneYet")).toBeTruthy();
  });

  it("keeps the tag in the URL when paging", async () => {
    withSection(fullFirstPage(), { tags: ["graphs"], total: 22 });

    const { router } = await renderRoute("/interview/coding?tag=graphs");
    await screen.findByText("Note n00");

    screen.getByRole("button", { name: "2" }).click();

    await waitFor(() => expect(router.state.location.search).toEqual({ tag: "graphs", page: 2 }));
  });
});
