// @vitest-environment jsdom
//
// The /interview/$section listing. Mirrors the posts archive (pinned block,
// `?tag=` filter, pagination, year grouping) with two differences that are
// exactly where a shared-by-copy implementation drifts: the page holds 20 not
// 8, and notes carry tag *names* rather than slugs, so the filter matches on a
// different field. Both are pinned here.
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
// object shape fails `pnpm typecheck` rather than sitting here as the suite's
// only executable description of the contract.
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

const sectionDataFn = vi.fn();
vi.mock("@/server/public", () => ({
  interviewShellFn: async () => ({
    sections: [{ slug: "coding", label: "Coding" }],
    siteName: "Unconstrained",
    social: { github: null, twitter: null, linkedin: null, email: null },
  }),
  searchInterviewNotesFn: searchInterviewNotes,
  sectionDataFn: () => sectionDataFn(),
}));

installShellStubs();

function note(slug: string, date: string, extra: Record<string, unknown> = {}) {
  return { slug, title: `Note ${slug}`, date, minutes: 4, pinned: false, tags: [], ...extra };
}

function withSection(notes: unknown[], tags: string[] = [], blurb: string | null = null) {
  sectionDataFn.mockResolvedValue({
    pageTitle: "Coding",
    siteName: "Unconstrained",
    section: { slug: "coding", label: "Coding", blurb },
    tags,
    notes,
  });
}

/** 22 notes — two more than one 20-item page holds. */
function twentyTwoNotes() {
  return Array.from({ length: 22 }, (_, i) =>
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
    withSection([note("a", "2025-03-02")], [], "How I practise algorithms.");

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

  it("lifts pinned notes into their own block and out of the year list", async () => {
    withSection([note("pin", "2025-01-01", { pinned: true }), note("plain", "2025-02-02")]);

    await renderRoute("/interview/coding");

    await screen.findByText("./pinned/");
    expect(screen.getAllByText("Note pin")).toHaveLength(1);
    expect(screen.getByText("Note plain")).toBeTruthy();
  });

  it("holds 20 notes to a page, not the archive's 8", async () => {
    withSection(twentyTwoNotes());

    await renderRoute("/interview/coding");

    await screen.findByText("Note n00");
    // The 20th is on page one; the 21st is not.
    expect(screen.getByText("Note n19")).toBeTruthy();
    expect(screen.queryByText("Note n20")).toBeNull();
  });

  it("clamps a page number past the end back to the last real page", async () => {
    withSection(twentyTwoNotes());

    await renderRoute("/interview/coding?page=99");

    expect(await screen.findByText("Note n20")).toBeTruthy();
    expect(screen.getByText("Note n21")).toBeTruthy();
  });

  it("filters by tag name rather than slug", async () => {
    withSection(
      [
        note("dp", "2025-05-05", { tags: ["dynamic programming"] }),
        note("other", "2025-04-04", { tags: ["graphs"] }),
      ],
      ["dynamic programming", "graphs"],
    );

    await renderRoute("/interview/coding?tag=dynamic%20programming");

    expect(await screen.findByText("Note dp")).toBeTruthy();
    expect(screen.queryByText("Note other")).toBeNull();
  });

  it("lets pinned notes compete on tags while a filter is active", async () => {
    withSection(
      [
        note("pin", "2025-05-05", { pinned: true, tags: ["graphs"] }),
        note("plain", "2025-04-04", { tags: ["graphs"] }),
      ],
      ["graphs"],
    );

    await renderRoute("/interview/coding?tag=graphs");

    await screen.findByText("Note pin");
    expect(screen.queryByText("./pinned/")).toBeNull();
    expect(screen.getByText("Note plain")).toBeTruthy();
  });

  it("renders the filter chips and marks the active one", async () => {
    withSection([note("a", "2025-03-02", { tags: ["graphs"] })], ["graphs", "trees"]);

    await renderRoute("/interview/coding?tag=graphs");

    const active = await screen.findByText("#graphs");
    expect(active.className).toContain("border-tm-accent");
    // `all` clears the filter and is inactive while a tag is applied.
    expect(screen.getByText("all").className).toContain("text-tm-muted");
  });

  it("marks `all` active when no tag is applied", async () => {
    withSection([note("a", "2025-03-02")], ["graphs"]);

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
    withSection([note("a", "2025-03-02", { tags: ["graphs"] })], ["graphs"]);

    await renderRoute("/interview/coding?tag=trees");

    expect(await screen.findByText("blog.interview.noneYet")).toBeTruthy();
    expect(screen.queryByText("Note a")).toBeNull();
  });

  it("keeps the tag in the URL when paging", async () => {
    withSection(
      twentyTwoNotes().map((n) => ({ ...n, tags: ["graphs"] })),
      ["graphs"],
    );

    const { router } = await renderRoute("/interview/coding?tag=graphs");
    await screen.findByText("Note n00");

    screen.getByRole("button", { name: "2" }).click();

    await waitFor(() => expect(router.state.location.search).toEqual({ tag: "graphs", page: 2 }));
  });
});
