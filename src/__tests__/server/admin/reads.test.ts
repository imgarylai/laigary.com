// @vitest-environment node
//
// Admin read impls behind the route-loader server fns, run against the real
// better-sqlite3 harness with factory-seeded rows: happy path per impl, then
// the null/empty branches, then the isolated computeOgBrand cases.
import { describe, it, expect } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";
import { seedNote, seedPage, seedPost, seedSection, seedTag, seedWork } from "../../factories";

setupTestDb();

async function setSettings(values: Record<string, string>) {
  const { updateSiteSettings } = await import("@/db/queries");
  await updateSiteSettings(values);
}

describe("listPostsImpl", () => {
  it("returns every post regardless of status", async () => {
    await seedPost({ slug: "live" });
    await seedPost({ slug: "wip", status: "draft" });
    const { listPostsImpl } = await import("@/server/admin/reads");
    const posts = await listPostsImpl();
    expect(posts.map((p) => p.slug).sort()).toEqual(["live", "wip"]);
  });
});

describe("dashboardStatsImpl", () => {
  it("returns content counts across posts, notes, pages and tags", async () => {
    await seedPost({ status: "published" });
    await seedPost({ status: "draft" });
    await seedPage();
    await seedTag();
    const section = await seedSection();
    await seedNote(section.id);
    const { dashboardStatsImpl } = await import("@/server/admin/reads");
    const s = await dashboardStatsImpl();
    expect(s).toMatchObject({
      postsTotal: 2,
      postsPublished: 1,
      postsDrafts: 1,
      notes: 1,
      pages: 1,
    });
    expect(s.tags).toBe(1);
  });
});

describe("listTagsImpl", () => {
  it("returns tags with usage", async () => {
    const tag = await seedTag({ name: "Life", slug: "life" });
    await seedPost({ tagIds: [tag.id] });
    const { listTagsImpl } = await import("@/server/admin/reads");
    const tags = await listTagsImpl();
    expect(tags).toHaveLength(1);
    expect(tags[0].slug).toBe("life");
    expect(tags[0].postCount).toBe(1);
  });
});

describe("listSectionsImpl", () => {
  it("pairs sections with their note counts, defaulting to 0", async () => {
    const a = await seedSection({ slug: "coding" });
    await seedSection({ slug: "empty" });
    await seedNote(a.id);
    await seedNote(a.id);
    const { listSectionsImpl } = await import("@/server/admin/reads");
    const sections = await listSectionsImpl();
    expect(sections.find((s) => s.slug === "coding")?.noteCount).toBe(2);
    expect(sections.find((s) => s.slug === "empty")?.noteCount).toBe(0);
  });
});

describe("listNotesImpl", () => {
  it("returns notes with their section labels", async () => {
    const section = await seedSection({ slug: "coding", label: "Coding" });
    await seedNote(section.id, { slug: "gas" });
    const { listNotesImpl } = await import("@/server/admin/reads");
    const { items, total, pageSize } = await listNotesImpl();
    expect(items).toHaveLength(1);
    expect(items[0].sectionLabel).toBe("Coding");
    expect(total).toBe(1);
    expect(pageSize).toBeGreaterThan(0);
  });

  it("turns a page number into an offset", async () => {
    const section = await seedSection({ slug: "coding", label: "Coding" });
    const { listNotesImpl } = await import("@/server/admin/reads");
    const { pageSize } = await listNotesImpl();
    for (let i = 0; i < pageSize + 1; i++) {
      await seedNote(section.id, { slug: `n${i}`, title: `Note ${i}` });
    }

    const first = await listNotesImpl();
    const second = await listNotesImpl({ page: 2 });
    expect(first.items).toHaveLength(pageSize);
    expect(second.items).toHaveLength(1);
    // Both pages report the same total; only the window moves.
    expect(second.total).toBe(pageSize + 1);
  });

  it("passes the search term through to the query", async () => {
    const section = await seedSection({ slug: "coding", label: "Coding" });
    await seedNote(section.id, { slug: "a", title: "Two Sum" });
    await seedNote(section.id, { slug: "b", title: "Binary Search" });
    const { listNotesImpl } = await import("@/server/admin/reads");

    const result = await listNotesImpl({ q: "sum" });
    expect(result.items.map((n) => n.title)).toEqual(["Two Sum"]);
    expect(result.total).toBe(1);
  });

  it("falls back to the default ordering for a sort column it does not know", async () => {
    // `?sort=` is hand-editable. An unknown column is a stale URL, not a
    // request worth 500-ing over.
    const section = await seedSection({ slug: "coding", label: "Coding" });
    await seedNote(section.id, { slug: "a", title: "A" });
    const { listNotesImpl } = await import("@/server/admin/reads");

    const result = await listNotesImpl({ sort: "contentMd; drop table", dir: "asc" });
    expect(result.items).toHaveLength(1);
  });
});

describe("newNoteDataImpl", () => {
  it("returns section options and all tags", async () => {
    await seedSection({ label: "Coding" });
    await seedTag();
    const { newNoteDataImpl } = await import("@/server/admin/reads");
    const data = await newNoteDataImpl();
    expect(data.sections.map((s) => s.label)).toEqual(["Coding"]);
    expect(data.tags).toHaveLength(1);
  });
});

describe("editNoteDataImpl", () => {
  it("resolves the note's tags to tag ids", async () => {
    const section = await seedSection();
    const tag = await seedTag();
    const other = await seedTag();
    const { id } = await seedNote(section.id, { tagIds: [tag.id] });
    const { editNoteDataImpl } = await import("@/server/admin/reads");
    const data = await editNoteDataImpl({ id });
    expect(data.note?.tagIds).toEqual([tag.id]);
    expect(data.note?.tagIds).not.toContain(other.id);
    expect(data.sections).toHaveLength(1);
    // The section slug backs the edit page's "preview live page" link.
    expect(data.sections[0]?.slug).toBe(section.slug);
  });

  it("returns a null note (but sections/tags) for an unknown id", async () => {
    await seedSection();
    const { editNoteDataImpl } = await import("@/server/admin/reads");
    const data = await editNoteDataImpl({ id: "missing" });
    expect(data.note).toBeNull();
    expect(data.sections).toHaveLength(1);
  });
});

describe("searchLinkTargetsImpl", () => {
  it("merges posts and notes with internal urls, including drafts", async () => {
    await seedPost({ title: "Gas prices", slug: "gas-prices", status: "draft" });
    const section = await seedSection({ slug: "coding" });
    await seedNote(section.id, { title: "134. Gas Station", slug: "gas-station" });
    const { searchLinkTargetsImpl } = await import("@/server/admin/reads");
    const hits = await searchLinkTargetsImpl({ q: "Gas" });
    expect(hits.map((h) => h.url).sort()).toEqual([
      "/interview/coding/gas-station",
      "/posts/gas-prices",
    ]);
    expect(hits.find((h) => h.type === "post")?.status).toBe("draft");
    expect(hits.find((h) => h.type === "note")?.context).toBe("coding");
  });
});

describe("getSettingsImpl", () => {
  it("returns the settings key/value map", async () => {
    await setSettings({ site_name: "Blog" });
    const { getSettingsImpl } = await import("@/server/admin/reads");
    expect((await getSettingsImpl()).site_name).toBe("Blog");
  });
});

describe("listPagesImpl / getPageImpl", () => {
  it("lists pages and fetches one by slug", async () => {
    await seedPage({ slug: "about", title: "About", contentMd: "hi" });
    const { listPagesImpl, getPageImpl } = await import("@/server/admin/reads");
    expect((await listPagesImpl()).map((p) => p.slug)).toEqual(["about"]);
    const page = await getPageImpl({ slug: "about" });
    expect(page?.title).toBe("About");
    expect(page?.contentMd).toBe("hi");
  });

  it("getPageImpl returns null for a missing slug", async () => {
    const { getPageImpl } = await import("@/server/admin/reads");
    expect(await getPageImpl({ slug: "nope" })).toBeNull();
  });
});

describe("newPostDataImpl / editPostDataImpl", () => {
  it("returns tags plus the og brand derived from settings", async () => {
    await setSettings({ site_name: "Blog", site_url: "https://laigary.com" });
    await seedTag();
    const { newPostDataImpl } = await import("@/server/admin/reads");
    const data = await newPostDataImpl();
    expect(data.tags).toHaveLength(1);
    expect(data.ogBrand).toBe("Blog | laigary.com");
  });

  it("editPostDataImpl returns the post or null when missing", async () => {
    const { id } = await seedPost({ title: "Hello" });
    const { editPostDataImpl } = await import("@/server/admin/reads");
    expect((await editPostDataImpl({ id })).post?.title).toBe("Hello");
    expect((await editPostDataImpl({ id: "missing" })).post).toBeNull();
  });
});

describe("listWorksImpl", () => {
  it("returns every work regardless of status", async () => {
    await seedWork({ slug: "live" });
    await seedWork({ slug: "wip", status: "draft" });
    const { listWorksImpl } = await import("@/server/admin/reads");
    const works = await listWorksImpl();
    expect(works.map((w) => w.slug).sort()).toEqual(["live", "wip"]);
  });
});

describe("newWorkDataImpl / editWorkDataImpl", () => {
  it("returns tags plus the og brand derived from settings", async () => {
    await setSettings({ site_name: "Blog", site_url: "https://laigary.com" });
    await seedTag();
    const { newWorkDataImpl } = await import("@/server/admin/reads");
    const data = await newWorkDataImpl();
    expect(data.tags).toHaveLength(1);
    expect(data.ogBrand).toBe("Blog | laigary.com");
  });

  it("editWorkDataImpl returns the work or null when missing", async () => {
    const { id } = await seedWork({ title: "Hello" });
    const { editWorkDataImpl } = await import("@/server/admin/reads");
    expect((await editWorkDataImpl({ id })).work?.title).toBe("Hello");
    expect((await editWorkDataImpl({ id: "missing" })).work).toBeNull();
  });
});

describe("computeOgBrand", () => {
  it("joins name and host, falls back through bad or missing urls", async () => {
    const { computeOgBrand } = await import("@/server/admin/reads");
    expect(computeOgBrand({ site_name: "Blog", site_url: "https://laigary.com" })).toBe(
      "Blog | laigary.com",
    );
    expect(computeOgBrand({ site_name: "Blog" })).toBe("Blog");
    expect(computeOgBrand({ site_name: "Blog", site_url: "not a url" })).toBe("Blog");
    expect(computeOgBrand({})).toBe("Unconstrained");
  });
});
