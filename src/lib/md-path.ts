// Which URLs have a markdown twin, and which document each one names. Pure and
// separate from `server/md.ts` (which does the DB reads and builds the body) for
// the same reason `lib/http-cache.ts` is separate from the middleware that uses
// it: the decision is what regresses, and the middleware in `src/start.ts` can
// only run inside a Worker.

/** The extension that asks for markdown instead of the rendered page. */
export const MD_SUFFIX = ".md";

/** A content document that has markdown behind it, addressed by its public path. */
export type MdDoc =
  | { kind: "post"; slug: string }
  | { kind: "work"; slug: string }
  | { kind: "page"; slug: string }
  | { kind: "note"; section: string; slug: string };

/**
 * Whether this request is asking for markdown at all.
 *
 * The gate in front of the whole feature, kept deliberately coarse: it decides
 * only that the markdown handler should look, never whether anything is there.
 * Methods other than GET/HEAD fall through to the router, which answers them
 * the way it answers any other unroutable request.
 */
export function isMarkdownRequest(method: string, pathname: string): boolean {
  return (method === "GET" || method === "HEAD") && pathname.endsWith(MD_SUFFIX);
}

/**
 * Which document `pathname` names, or null when it names none.
 *
 * The four shapes mirror the four public detail routes exactly — `/posts/$slug`,
 * `/works/$slug`, `/interview/$section/$slug` and the `_site/$slug` catch-all —
 * so a page's markdown URL is always that page's own URL with `.md` glued on.
 *
 * LIST pages (`/posts`, `/interview/<section>`, `/tags/<slug>`) deliberately
 * resolve to nothing: they are views over rows, not documents with a markdown
 * source, and the machine-readable index of the whole site already exists at
 * `/llms.txt`. A one-segment path reads as a content page, which is what makes
 * `/posts.md` a 404 without a reserved-word list to keep in sync — the router
 * owns `/posts`, so no page row is filed under that slug for the lookup to find.
 */
export function parseMdPath(pathname: string): MdDoc | null {
  if (!pathname.endsWith(MD_SUFFIX)) return null;

  let segments: string[];
  try {
    segments = pathname
      .slice(0, -MD_SUFFIX.length)
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent);
  } catch {
    // A malformed percent-escape names no document, and decodeURIComponent
    // throws on it rather than returning something we could look up.
    return null;
  }

  if (segments.length === 1) return { kind: "page", slug: segments[0] };
  if (segments.length === 2) {
    const [head, slug] = segments;
    if (head === "posts") return { kind: "post", slug };
    if (head === "works") return { kind: "work", slug };
    return null;
  }
  if (segments.length === 3 && segments[0] === "interview") {
    return { kind: "note", section: segments[1], slug: segments[2] };
  }
  return null;
}
