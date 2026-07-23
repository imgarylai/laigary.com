// @vitest-environment node
//
// The public read impls behind the route-loader server fns, run against the
// real better-sqlite3 harness: happy path per impl, then the null/fallback
// branches, then the isolated input validators.
import { describe, it, expect } from "vitest";
import { setupTestDb } from "../db/helpers/test-db";
import { seedPage, seedPost, seedSection, seedNote, seedTag } from "../factories";

setupTestDb();

async function setSettings(values: Record<string, string>) {
  const { updateSiteSettings } = await import("@/db/queries");
  await updateSiteSettings(values);
}

describe("blogShellImpl", () => {
  it("returns the configured site name and resolved social hrefs", async () => {
    await setSettings({ site_name: "Unconstrained", author_github: "imgarylai" });
    const { blogShellImpl } = await import("@/server/public");
    const shell = await blogShellImpl();
    expect(shell.siteName).toBe("Unconstrained");
    expect(shell.social.github).toBe("https://github.com/imgarylai");
    expect(shell.social.linkedin).toBeNull();
  });

  it("falls back to the default brand when site_name is unset", async () => {
    const { blogShellImpl, DEFAULT_SITE_NAME } = await import("@/server/public");
    expect((await blogShellImpl()).siteName).toBe(DEFAULT_SITE_NAME);
  });
});

describe("homeDataImpl", () => {
  it("returns counts, latest date and whoami built from author fields", async () => {
    await setSettings({
      author_name: "Gary",
      author_location: "SF",
      author_twitter: "imgarylai",
    });
    // tagCount only counts tags in use on published posts (getTagsWithCounts).
    const tag = await seedTag();
    await seedPost({ tagIds: [tag.id] });
    await seedPost();
    const { homeDataImpl } = await import("@/server/public");
    const home = await homeDataImpl();
    expect(home.postCount).toBe(2);
    expect(home.tagCount).toBe(1);
    expect(home.latestDate).toBeTruthy();
    expect(home.whoami).toBe("Gary · SF");
    expect(home.socialUrls).toEqual(["https://x.com/imgarylai"]);
  });

  it("prefers the explicit whoami setting over the author fields", async () => {
    await setSettings({ whoami: "gary@unconstrained", author_name: "Gary" });
    const { homeDataImpl } = await import("@/server/public");
    expect((await homeDataImpl()).whoami).toBe("gary@unconstrained");
  });
});

describe("postsDataImpl", () => {
  it("returns published posts with head chrome", async () => {
    await setSettings({ site_name: "Blog", title_template: "%s | Blog" });
    await seedPost({ title: "Hello", slug: "hello" });
    await seedPost({ status: "draft" });
    const { postsDataImpl } = await import("@/server/public");
    const data = await postsDataImpl();
    expect(data.posts.map((p) => p.slug)).toEqual(["hello"]);
    expect(data.pageTitle).toBe("Posts | Blog");
    expect(data.siteName).toBe("Blog");
  });
});

describe("postDataImpl", () => {
  it("renders markdown, extracts the toc and builds the page title", async () => {
    await setSettings({ title_template: "%s | Blog" });
    await seedPost({ title: "Hello", slug: "hello", contentMd: "## Section A\n\nsome **bold**" });
    const { postDataImpl } = await import("@/server/public");
    const data = await postDataImpl({ slug: "hello" });
    expect(data?.post.title).toBe("Hello");
    expect(data?.html).toContain("<strong>bold</strong>");
    expect(data?.toc).toEqual(["Section A"]);
    expect(data?.pageTitle).toBe("Hello | Blog");
    // Lone post: both chronological neighbors are open.
    expect(data?.adjacent).toEqual({ prev: null, next: null });
    // No excerpt on the seed → description falls back to the body text.
    expect(data?.description).toBe("Section A some bold");
  });

  it("returns null for a missing or draft slug", async () => {
    await seedPost({ slug: "wip", status: "draft" });
    const { postDataImpl } = await import("@/server/public");
    expect(await postDataImpl({ slug: "nope" })).toBeNull();
    expect(await postDataImpl({ slug: "wip" })).toBeNull();
  });
});

describe("tagDataImpl", () => {
  it("should return both posts and interview notes carrying the tag with head chrome", async () => {
    await setSettings({ title_template: "%s | Blog" });
    const tag = await seedTag({ name: "Life", slug: "life" });
    await seedPost({ title: "Hello", slug: "hello", tagIds: [tag.id] });
    const section = await seedSection({ slug: "coding", label: "Coding" });
    await seedNote(section.id, { title: "Note A", slug: "note-a", tagIds: [tag.id] });
    const { tagDataImpl } = await import("@/server/public");

    const data = await tagDataImpl({ slug: "life" });
    expect(data?.tag).toEqual({ name: "Life", slug: "life" });
    expect(data?.posts.map((p) => p.slug)).toEqual(["hello"]);
    expect(data?.notes.map((n) => ({ slug: n.slug, section: n.sectionSlug }))).toEqual([
      { slug: "note-a", section: "coding" },
    ]);
    expect(data?.pageTitle).toBe("#Life | Blog");
  });

  it("should resolve a note-only tag (no posts) instead of 404ing", async () => {
    const tag = await seedTag({ name: "Monotonic", slug: "monotonic" });
    const section = await seedSection({ slug: "coding", label: "Coding" });
    await seedNote(section.id, { title: "Stack", slug: "stack", tagIds: [tag.id] });
    const { tagDataImpl } = await import("@/server/public");

    const data = await tagDataImpl({ slug: "monotonic" });
    expect(data?.posts).toEqual([]);
    expect(data?.notes.map((n) => n.slug)).toEqual(["stack"]);
  });

  it("should return null when the tag is unknown or all its content is drafts", async () => {
    const tag = await seedTag({ name: "WIP", slug: "wip" });
    await seedPost({ status: "draft", tagIds: [tag.id] });
    const section = await seedSection({ slug: "s", label: "S" });
    await seedNote(section.id, { status: "draft", tagIds: [tag.id] });
    const { tagDataImpl } = await import("@/server/public");

    expect(await tagDataImpl({ slug: "nope" })).toBeNull();
    expect(await tagDataImpl({ slug: "wip" })).toBeNull();
  });
});

describe("tagsDataImpl", () => {
  it("returns tags with a combined post + note count", async () => {
    const tag = await seedTag({ name: "Life", slug: "life" });
    await seedPost({ tagIds: [tag.id] });
    const section = await seedSection({ slug: "coding", label: "Coding" });
    await seedNote(section.id, { tagIds: [tag.id] });
    const { tagsDataImpl } = await import("@/server/public");
    const data = await tagsDataImpl();
    expect(data.tags).toEqual([{ name: "Life", slug: "life", count: 2 }]);
  });
});

describe("pageDataImpl", () => {
  it("returns the rendered page for an existing slug", async () => {
    await seedPage({ slug: "about", title: "About", contentMd: "hi *there*" });
    const { pageDataImpl } = await import("@/server/public");
    const data = await pageDataImpl({ slug: "about" });
    expect(data?.page).toEqual({ slug: "about", title: "About" });
    expect(data?.html).toContain("<em>there</em>");
  });

  it("returns null for a missing slug", async () => {
    const { pageDataImpl } = await import("@/server/public");
    expect(await pageDataImpl({ slug: "nope" })).toBeNull();
  });
});

describe("interviewShellImpl", () => {
  it("returns the section list plus footer branding", async () => {
    await setSettings({ site_name: "Unconstrained" });
    await seedSection({ slug: "coding", label: "Coding" });
    const { interviewShellImpl } = await import("@/server/public");
    const shell = await interviewShellImpl();
    expect(shell.sections).toEqual([{ slug: "coding", label: "Coding" }]);
    expect(shell.siteName).toBe("Unconstrained");
  });
});

describe("searchInterviewNotesImpl", () => {
  it("matches published note titles across sections", async () => {
    const a = await seedSection({ slug: "coding" });
    const b = await seedSection({ slug: "system-design" });
    await seedNote(a.id, { title: "Gas Station", slug: "gas" });
    await seedNote(b.id, { title: "Gas Pipeline Design", slug: "pipeline" });
    await seedNote(a.id, { title: "Two Sum", slug: "two-sum" });
    const { searchInterviewNotesImpl } = await import("@/server/public");
    const hits = await searchInterviewNotesImpl({ q: "Gas" });
    expect(hits.map((h) => h.slug).sort()).toEqual(["gas", "pipeline"]);
  });
});

describe("interviewDataImpl", () => {
  it("returns per-section counts and the recent notes with section slugs", async () => {
    const section = await seedSection({ slug: "coding", label: "Coding" });
    await seedNote(section.id, { title: "Two Sum" });
    await seedNote(section.id, { title: "BFS" });
    const { interviewDataImpl } = await import("@/server/public");
    const data = await interviewDataImpl();
    expect(data.sections).toEqual([expect.objectContaining({ slug: "coding", count: 2 })]);
    expect(data.recent).toHaveLength(2);
    expect(data.recent[0].section).toBe("coding");
    expect(data.recent[0].minutes).toBeGreaterThan(0);
  });
});

describe("sectionDataImpl", () => {
  it("returns section, tag names and mapped notes", async () => {
    const section = await seedSection({ slug: "coding", label: "Coding", blurb: "algos" });
    const tag = await seedTag({ name: "greedy", slug: "greedy" });
    await seedNote(section.id, { title: "Gas Station", slug: "gas", tagIds: [tag.id] });
    const { sectionDataImpl } = await import("@/server/public");
    const data = await sectionDataImpl({ slug: "coding" });
    expect(data?.section).toEqual({ slug: "coding", label: "Coding", blurb: "algos" });
    expect(data?.tags).toEqual(["greedy"]);
    expect(data?.notes.map((n) => n.slug)).toEqual(["gas"]);
    expect(data?.notes[0].tags).toEqual(["greedy"]);
  });

  it("returns null for an unknown section", async () => {
    const { sectionDataImpl } = await import("@/server/public");
    expect(await sectionDataImpl({ slug: "nope" })).toBeNull();
  });
});

describe("noteDataImpl", () => {
  it("returns the note with section label and rendered html", async () => {
    const section = await seedSection({ slug: "coding", label: "Coding" });
    await seedNote(section.id, { title: "Gas Station", slug: "gas", contentMd: "use `greedy`" });
    const { noteDataImpl } = await import("@/server/public");
    const data = await noteDataImpl({ section: "coding", slug: "gas" });
    expect(data?.note.sectionLabel).toBe("Coding");
    expect(data?.note.tags).toEqual([]);
    expect(data?.html).toContain("<code>greedy</code>");
  });

  it("returns null for a missing note", async () => {
    await seedSection({ slug: "coding" });
    const { noteDataImpl } = await import("@/server/public");
    expect(await noteDataImpl({ section: "coding", slug: "nope" })).toBeNull();
  });
});

describe("pageChrome", () => {
  it("applies the title_template and falls back without one", async () => {
    const { pageChrome, DEFAULT_SITE_NAME } = await import("@/server/public");
    const plain = await pageChrome("Posts");
    expect(plain.siteName).toBe(DEFAULT_SITE_NAME);

    await setSettings({ site_name: "Blog", title_template: "%s — Blog" });
    const templated = await pageChrome("Posts");
    expect(templated.pageTitle).toBe("Posts — Blog");
    expect(templated.siteName).toBe("Blog");
  });
});

describe("slugInput", () => {
  it("accepts a non-empty slug and rejects bad shapes", async () => {
    const { slugInput } = await import("@/server/public");
    expect(slugInput({ slug: "hello" })).toEqual({ slug: "hello" });
    expect(() => slugInput({ slug: "" })).toThrow();
    expect(() => slugInput({})).toThrow();
    expect(() => slugInput(null)).toThrow();
  });
});
