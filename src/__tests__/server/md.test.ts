// @vitest-environment node
//
// The `<page url>.md` endpoint, against the real better-sqlite3 harness: a
// not-found and a not-yet-due post are things the query layer produces for
// real, and those two are the whole risk surface here — one leaks unpublished
// writing, the other decides what a crawler is told.
import { describe, it, expect } from "vitest";
import { setupTestDb } from "../db/helpers/test-db";
import { seedNote, seedPage, seedPost, seedSection, seedTag, seedWork } from "../factories";

setupTestDb();

const MARKDOWN = "text/markdown; charset=utf-8";

async function serve(pathname: string) {
  const { serveMarkdown } = await import("@/server/md");
  const response = await serveMarkdown(pathname);
  return { response, body: await response.text() };
}

describe("serveMarkdown", () => {
  it("should return a post's own markdown under a front matter header when it is live", async () => {
    const tag = await seedTag({ name: "Go" });
    await seedPost({
      slug: "hello",
      // A colon AND a quote: both are what a naive YAML escaper gets wrong, and
      // either one unescaped makes the header unparseable rather than ugly.
      title: 'Two Sum: a "greedy" start',
      excerpt: "The first post",
      contentMd: "## Body\n\nSome *markdown*.",
      tagIds: [tag.id],
    });

    const { response, body } = await serve("/posts/hello.md");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(MARKDOWN);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Link")).toBe('<https://laigary.com/posts/hello>; rel="canonical"');
    expect(body).toContain('title: "Two Sum: a \\"greedy\\" start"');
    expect(body).toContain('url: "https://laigary.com/posts/hello"');
    expect(body).toContain('type: "post"');
    expect(body).toContain('excerpt: "The first post"');
    expect(body).toContain('tags: ["Go"]');
    // The title is added as an H1 because no stored content_md carries one —
    // the routes render the title from its own column.
    expect(body).toContain('# Two Sum: a "greedy" start\n\n## Body\n\nSome *markdown*.');
  });

  it("should omit the fields a row left empty rather than emit them as null", async () => {
    // Seeded with a repo but no role or cover: an absent field must leave no
    // line at all, so a reader never has to tell "unset" from "set to nothing".
    await seedWork({
      slug: "laigary",
      title: "laigary.com",
      summary: "This site",
      repoUrl: "https://github.com/imgarylai/laigary.com",
      year: 2024,
      contentMd: "Built on Workers.",
    });

    const { response, body } = await serve("/works/laigary.md");

    expect(response.status).toBe(200);
    expect(body).toContain('repo_url: "https://github.com/imgarylai/laigary.com"');
    expect(body).toContain("year: 2024");
    expect(body).not.toContain("role:");
    expect(body).not.toContain("cover:");
    expect(body).not.toContain("end_year:");
    expect(body).not.toContain("tags:");
  });

  it("should carry a work's stack as tag names when it has any", async () => {
    const tag = await seedTag({ name: "Cloudflare" });
    await seedWork({ slug: "tagged", year: 2024, tagIds: [tag.id] });

    const { body } = await serve("/works/tagged.md");

    // Names, not slugs: the front matter is the human-readable twin of the
    // tag row the page renders, and the slug is an addressing detail.
    expect(body).toContain('tags: ["Cloudflare"]');
  });

  it("should return a page's markdown when the slug is a content page", async () => {
    await seedPage({ slug: "about", title: "About", contentMd: "Hi." });

    const { response, body } = await serve("/about.md");

    expect(response.status).toBe(200);
    expect(response.headers.get("Link")).toBe('<https://laigary.com/about>; rel="canonical"');
    expect(body).toContain('type: "page"');
    expect(body).toContain("# About\n\nHi.");
  });

  it("should return an interview note's markdown when it is live in that section", async () => {
    const section = await seedSection({ slug: "coding" });
    const tag = await seedTag({ name: "Hash Map" });
    await seedNote(section.id, {
      slug: "two-sum",
      title: "Two Sum",
      contentMd: "Use a map.",
      tagIds: [tag.id],
    });

    const { response, body } = await serve("/interview/coding/two-sum.md");

    expect(response.status).toBe(200);
    expect(response.headers.get("Link")).toBe(
      '<https://laigary.com/interview/coding/two-sum>; rel="canonical"',
    );
    expect(body).toContain('type: "note"');
    expect(body).toContain('section: "coding"');
    expect(body).toContain('tags: ["Hash Map"]');
    expect(body).toContain("# Two Sum\n\nUse a map.");
  });

  it("should 404 in markdown when no document lives at the path", async () => {
    const { response, body } = await serve("/posts/nope.md");

    expect(response.status).toBe(404);
    // The caller asked for markdown; the site's React 404 page is no use to it.
    expect(response.headers.get("Content-Type")).toBe(MARKDOWN);
    expect(response.headers.get("Link")).toBeNull();
    expect(body).toContain('error: "not_found"');
    expect(body).toContain("# Not found");
    expect(body).toContain("https://laigary.com/llms.txt");
  });

  it("should 404 for a listing url, which is a view rather than a document", async () => {
    await seedPost({ slug: "hello" });

    expect((await serve("/posts.md")).response.status).toBe(404);
    expect((await serve("/interview/coding.md")).response.status).toBe(404);
  });

  it("should 404 for a draft post so the source is no easier to reach than the page", async () => {
    await seedPost({ slug: "secret", status: "draft" });

    expect((await serve("/posts/secret.md")).response.status).toBe(404);
  });

  it("should 404 for a post whose publish date has not arrived yet", async () => {
    // The leak this endpoint could most easily introduce: `status = published`
    // is true a week early, and only the date filter keeps the draft off the
    // wire. Seeded published so nothing but the date can be doing the work.
    await seedPost({
      slug: "scheduled",
      status: "published",
      publishedAt: Math.floor(Date.now() / 1000) + 86_400,
    });

    expect((await serve("/posts/scheduled.md")).response.status).toBe(404);
  });

  it("should 404 for a draft note so the section listing is not the only guard", async () => {
    const section = await seedSection({ slug: "coding" });
    await seedNote(section.id, { slug: "wip", status: "draft" });

    expect((await serve("/interview/coding/wip.md")).response.status).toBe(404);
  });

  it("should 404 for a work that is not published", async () => {
    await seedWork({ slug: "unfinished", status: "draft" });

    expect((await serve("/works/unfinished.md")).response.status).toBe(404);
  });
});
