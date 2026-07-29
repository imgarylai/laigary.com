// @vitest-environment node
//
// The four /api/og* routes. Rendering, fonts and caching belong to server/og
// and lib/og; each route's own contribution is the node it asks for — the title
// it pulls from the DB, the not-found title it falls back to when the slug does
// not resolve (a crawler hitting a deleted post must still get an image, never a
// throw), and the kicker/date it derives from the params.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SiteBranding } from "@/server/og";

const getPostBySlug = vi.fn();
const getPageBySlug = vi.fn();
const getInterviewNote = vi.fn();
const getWorkBySlug = vi.fn();
vi.mock("@/db/queries", () => ({
  getPostBySlug: (slug: string) => getPostBySlug(slug),
  getPageBySlug: (slug: string) => getPageBySlug(slug),
  getInterviewNote: (sect: string, slug: string) => getInterviewNote(sect, slug),
  getWorkBySlug: (slug: string) => getWorkBySlug(slug),
}));

const articleTemplate = vi.fn();
const siteTemplate = vi.fn();
vi.mock("@/lib/og/templates", async (importOriginal) => ({
  // Keep the real date formatters — dateLabel assertions below are about the
  // route picking the right source field, and a mocked formatter would hide that.
  ...(await importOriginal<typeof import("@/lib/og/templates")>()),
  articleTemplate: (args: unknown) => articleTemplate(args),
  siteTemplate: (args: unknown) => siteTemplate(args),
}));

// Stand in for the handler plumbing (covered in server/og.test.ts) and run the
// builder the route handed it, so the assertions land on the route's own work.
const branding: SiteBranding = {
  siteName: "Gary's Blog",
  siteUrl: "blog.example",
  description: "notes",
  branding: "Gary's Blog | blog.example",
};
vi.mock("@/server/og", () => ({
  serveOgImage: async (_req: Request, buildNode: (b: SiteBranding) => Promise<unknown>) => {
    await buildNode(branding);
    return new Response(null, { headers: { "Content-Type": "image/png" } });
  },
}));

const { Route: OgSiteRoute } = await import("@/routes/api/og");
const { Route: OgPostRoute } = await import("@/routes/api/og.posts.$slug");
const { Route: OgPageRoute } = await import("@/routes/api/og.pages.$slug");
const { Route: OgNoteRoute } = await import("@/routes/api/og.interview.$sect.$slug");
const { Route: OgWorkRoute } = await import("@/routes/api/og.works.$slug");

type Ctx = { request: Request; params: Record<string, string> };

function get(route: { options: unknown }) {
  return (route.options as { server: { handlers: { GET: (c: Ctx) => Promise<Response> } } }).server
    .handlers.GET;
}

const request = new Request("http://test.local/api/og");

beforeEach(() => {
  vi.clearAllMocks();
  articleTemplate.mockReturnValue({ type: "div" });
  siteTemplate.mockReturnValue({ type: "div" });
});

describe("/api/og", () => {
  it("builds the site card from the resolved branding fields", async () => {
    const res = await get(OgSiteRoute)({ request, params: {} });

    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(siteTemplate).toHaveBeenCalledWith({
      siteName: "Gary's Blog",
      description: "notes",
      siteUrl: "blog.example",
    });
  });
});

describe("/api/og/posts/$slug", () => {
  it("titles the card with the post and formats its publish day", async () => {
    getPostBySlug.mockResolvedValue({ title: "Hello", date: "2025-07-19" });

    await get(OgPostRoute)({ request, params: { slug: "hello" } });

    expect(getPostBySlug).toHaveBeenCalledWith("hello");
    expect(articleTemplate).toHaveBeenCalledWith({
      title: "Hello",
      branding: branding.branding,
      dateLabel: "2025年7月19日",
      kicker: null,
    });
  });

  it("still renders a card when the slug resolves to nothing", async () => {
    getPostBySlug.mockResolvedValue(undefined);

    await get(OgPostRoute)({ request, params: { slug: "gone" } });

    expect(articleTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Post not found", dateLabel: null }),
    );
  });
});

describe("/api/og/pages/$slug", () => {
  it("kickers the card with the page's source filename", async () => {
    getPageBySlug.mockResolvedValue({ title: "About" });

    await get(OgPageRoute)({ request, params: { slug: "about" } });

    expect(articleTemplate).toHaveBeenCalledWith({
      title: "About",
      branding: branding.branding,
      dateLabel: null,
      kicker: "./about.md",
    });
  });

  it("still renders a card when the page is missing", async () => {
    getPageBySlug.mockResolvedValue(undefined);

    await get(OgPageRoute)({ request, params: { slug: "gone" } });

    expect(articleTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Page not found", kicker: "./gone.md" }),
    );
  });
});

describe("/api/og/works/$slug", () => {
  it("labels the card with the work's year range, not its publish date", async () => {
    // A portfolio card's meaningful date is when the thing was made; the entry
    // may have gone up years later.
    getWorkBySlug.mockResolvedValue({ title: "Ranged", year: 2021, endYear: 2023 });

    await get(OgWorkRoute)({ request, params: { slug: "ranged" } });

    expect(articleTemplate).toHaveBeenCalledWith({
      title: "Ranged",
      branding: branding.branding,
      dateLabel: "2021–2023",
      kicker: "./works/ranged.md",
    });
  });

  it("collapses a single-year work to one label", async () => {
    getWorkBySlug.mockResolvedValue({ title: "Single", year: 2025, endYear: null });

    await get(OgWorkRoute)({ request, params: { slug: "single" } });

    expect(articleTemplate).toHaveBeenCalledWith(expect.objectContaining({ dateLabel: "2025" }));
  });

  it("still renders a card when the work is missing", async () => {
    getWorkBySlug.mockResolvedValue(null);

    await get(OgWorkRoute)({ request, params: { slug: "gone" } });

    expect(articleTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Work not found",
        dateLabel: null,
        kicker: "./works/gone.md",
      }),
    );
  });
});

describe("/api/og/interview/$sect/$slug", () => {
  it("looks the note up by section and slug and kickers with its section", async () => {
    getInterviewNote.mockResolvedValue({ title: "134. Gas Station", publishedAt: 1752960000 });

    await get(OgNoteRoute)({ request, params: { sect: "coding", slug: "134-gas-station" } });

    expect(getInterviewNote).toHaveBeenCalledWith("coding", "134-gas-station");
    expect(articleTemplate).toHaveBeenCalledWith({
      title: "134. Gas Station",
      branding: branding.branding,
      dateLabel: expect.stringMatching(/^2025年7月(19|20)日$/),
      kicker: "./interview/coding/",
    });
  });

  it("drops the date label for a note that was never published", async () => {
    getInterviewNote.mockResolvedValue({ title: "Draft note", publishedAt: null });

    await get(OgNoteRoute)({ request, params: { sect: "coding", slug: "draft" } });

    expect(articleTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Draft note", dateLabel: null }),
    );
  });

  it("still renders a card when the note is missing", async () => {
    getInterviewNote.mockResolvedValue(undefined);

    await get(OgNoteRoute)({ request, params: { sect: "coding", slug: "gone" } });

    expect(articleTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Note not found", dateLabel: null }),
    );
  });
});
