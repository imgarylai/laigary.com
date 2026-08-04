import { getInterviewNote, getPageBySlug, getPostBySlug, getWorkBySlug } from "@/db/queries";
import { unixToIso } from "@/lib/date";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { parseMdPath, type MdDoc } from "@/lib/md-path";

// Server-only: the markdown twin of every content page. Append `.md` to a
// post, work, page or interview-note URL and this hands back the markdown the
// page was rendered FROM — not a conversion of the rendered HTML — plus a YAML
// front matter header carrying the metadata that otherwise only exists in the
// HTML chrome (dates, tags, the canonical URL).
//
// Reached from the request middleware in `src/start.ts`, never from a file
// route. The rule is one rule over the whole public URL space ("the page's own
// path plus .md"), and a route per content type would restate it four times
// while `/posts/$slug` still matched `/posts/hello.md` and answered it with the
// React 404 page. Which paths map to which document is `lib/md-path`; this
// module is the part that needs the database. Static query imports are safe for
// the same reason `server/llms.ts` uses them: the only import of this module is
// a dynamic one inside that middleware, so none of it reaches the client bundle.

/** The markdown response's content type, and the reason this endpoint exists. */
const CONTENT_TYPE = "text/markdown; charset=utf-8";

/** A built document: its markdown body, and the HTML page it is a twin of. */
export type MdDocument = { body: string; canonical: string };

/**
 * Build one document's markdown, or null when it is not published.
 *
 * Every lookup goes through the same getters the HTML routes use, so a draft
 * and a post scheduled for next week are invisible here for the same reason
 * they are invisible there — `livePosts()` / `liveNotes()`, applied once in the
 * query layer. Bypassing them with a direct select is how this surface would
 * become the leak the visibility predicate exists to prevent.
 */
export async function buildMdDocument(doc: MdDoc): Promise<MdDocument | null> {
  switch (doc.kind) {
    case "post":
      return buildPost(doc.slug);
    case "work":
      return buildWork(doc.slug);
    case "page":
      return buildPage(doc.slug);
    case "note":
      return buildNote(doc.section, doc.slug);
  }
}

/**
 * The markdown response for a `.md` request path.
 *
 * Always answers — an unresolvable path gets a 404 whose body is itself
 * markdown, because a client that asked for markdown cannot do anything with
 * the site's React 404 page.
 */
export async function serveMarkdown(pathname: string): Promise<Response> {
  const doc = parseMdPath(pathname);
  const built = doc ? await buildMdDocument(doc) : null;

  if (!built) {
    return new Response(notFoundBody(pathname), { status: 404, headers: headers() });
  }
  return new Response(built.body, {
    status: 200,
    // The HTML page and this are the same document in two formats. Without the
    // canonical pointer the pair reads as duplicated content to a crawler that
    // found both; `rel=alternate` on the HTML side (lib/og-meta) is the other
    // half of that link.
    headers: headers({ Link: `<${built.canonical}>; rel="canonical"` }),
  });
}

/**
 * Response headers for a markdown body.
 *
 * `nosniff` matters more here than on the HTML routes: the body echoes a path
 * the caller chose, and no browser may be allowed to decide for itself that a
 * document typed `text/markdown` is really HTML.
 *
 * No `Cache-Control` — the edge cache middleware in `src/start.ts` wraps this
 * one and sets it there, which is what keeps a markdown twin on the same TTL
 * (and the same scheduled-publish bound) as the page it mirrors.
 */
function headers(extra?: Record<string, string>): Record<string, string> {
  return { "Content-Type": CONTENT_TYPE, "X-Content-Type-Options": "nosniff", ...extra };
}

async function buildPost(slug: string): Promise<MdDocument | null> {
  const post = await getPostBySlug(slug);
  if (!post) return null;
  const canonical = `${SITE_ORIGIN}/posts/${post.slug}`;
  return {
    canonical,
    body: document(
      [
        ["title", post.title],
        ["url", canonical],
        ["type", "post"],
        ["date", post.date],
        ["updated", post.updatedAt],
        ["reading_time", post.readingTime],
        ["excerpt", post.excerpt],
        ["cover", post.coverImageUrl],
        ["tags", post.tags.map((tag) => tag.name)],
      ],
      post.title,
      post.contentMd,
    ),
  };
}

async function buildWork(slug: string): Promise<MdDocument | null> {
  const work = await getWorkBySlug(slug);
  if (!work) return null;
  const canonical = `${SITE_ORIGIN}/works/${work.slug}`;
  return {
    canonical,
    body: document(
      [
        ["title", work.title],
        ["url", canonical],
        ["type", "work"],
        ["date", work.date],
        ["updated", work.updatedAt],
        ["summary", work.summary],
        ["role", work.role],
        ["year", work.year],
        ["end_year", work.endYear],
        ["project_url", work.projectUrl],
        ["repo_url", work.repoUrl],
        ["cover", work.coverImageUrl],
        ["tags", work.tags.map((tag) => tag.name)],
      ],
      work.title,
      work.contentMd,
    ),
  };
}

async function buildPage(slug: string): Promise<MdDocument | null> {
  const page = await getPageBySlug(slug);
  if (!page) return null;
  const canonical = `${SITE_ORIGIN}/${page.slug}`;
  return {
    canonical,
    body: document(
      [
        ["title", page.title],
        ["url", canonical],
        ["type", "page"],
        ["updated", unixToIso(page.updatedAt)],
      ],
      page.title,
      page.contentMd,
    ),
  };
}

async function buildNote(section: string, slug: string): Promise<MdDocument | null> {
  const note = await getInterviewNote(section, slug);
  if (!note) return null;
  const canonical = `${SITE_ORIGIN}/interview/${section}/${note.slug}`;
  return {
    canonical,
    body: document(
      [
        ["title", note.title],
        ["url", canonical],
        ["type", "note"],
        ["section", section],
        ["date", unixToIso(note.publishedAt)],
        ["updated", unixToIso(note.updatedAt)],
        ["tags", note.tags.map((tag) => tag.name)],
      ],
      note.title,
      note.contentMd,
    ),
  };
}

/** One front matter entry. A number stays a number; the rest get quoted. */
type Field = [key: string, value: string | number | string[] | null];

/**
 * A YAML double-quoted scalar.
 *
 * `JSON.stringify` IS that encoding — YAML's double-quoted style takes the same
 * escapes JSON does — so a title containing a quote, a colon or a newline round
 * trips without a hand-rolled escaper to get wrong.
 */
function quote(value: string): string {
  return JSON.stringify(value);
}

/**
 * The `---` header, dropping every field the row left empty.
 *
 * Omitting rather than emitting `null` keeps the header a statement of what the
 * document HAS: a work with no repo has no `repo_url` line at all, so a reader
 * never has to tell "absent" from "present and null".
 */
function frontMatter(fields: Field[]): string {
  const lines = fields.flatMap(([key, value]) => {
    if (value === null || value === "") return [];
    if (Array.isArray(value)) {
      return value.length === 0 ? [] : [`${key}: [${value.map(quote).join(", ")}]`];
    }
    return [`${key}: ${typeof value === "number" ? value : quote(value)}`];
  });
  return ["---", ...lines, "---"].join("\n");
}

/**
 * Front matter, then the title as an H1, then the body.
 *
 * The H1 is added rather than found: every detail route renders the title from
 * its own column above the rendered content, so no stored `content_md` starts
 * with one and a bare body would arrive headless.
 */
function document(fields: Field[], title: string, contentMd: string): string {
  return `${frontMatter(fields)}\n\n# ${title}\n\n${contentMd.trim()}\n`;
}

function notFoundBody(pathname: string): string {
  const header = frontMatter([
    ["error", "not_found"],
    ["url", `${SITE_ORIGIN}${pathname}`],
  ]);
  return (
    `${header}\n\n# Not found\n\n` +
    `No markdown document lives at \`${pathname}\`.\n\n` +
    "Append `.md` to the URL of a post, a work, a page or an interview note — " +
    `for example \`${SITE_ORIGIN}/posts/<slug>.md\`. ` +
    `Listing pages have no markdown source; the index of everything that does ` +
    `is at ${SITE_ORIGIN}/llms.txt.\n`
  );
}
