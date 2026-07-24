// Table of contents for a post/note, derived from the *rendered* HTML rather
// than from the markdown source. rehype-slug owns id generation, so reading its
// output back is the only way anchors are guaranteed to match: re-deriving
// slugs from markdown would drift on headings carrying inline code or emphasis
// (`## **為何 \`range(n)\`?**`) and on the duplicate-title counter, which
// rehype-slug increments across *all* heading levels — including the h4s and
// raw-HTML headings a markdown-only scan would never see.
//
// Pure + dependency-free so it runs on server or client.

export type TocEntry = {
  /** 2 or 3 — h2 renders flush, h3 indented. */
  readonly depth: number;
  /** Heading label, inline markup flattened to text. */
  readonly text: string;
  /** The heading's `id`, i.e. the anchor target. */
  readonly id: string;
};

const HEADING_RE = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
const ID_RE = /\bid=(?:"([^"]*)"|'([^']*)')/i;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

// Flatten a heading's inner HTML to its text content: drop tags, decode the
// entities rehype-stringify emits, collapse whitespace.
function toText(inner: string): string {
  return inner
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
      const key = name.toLowerCase();
      if (key.startsWith("#x")) return String.fromCodePoint(parseInt(key.slice(2), 16));
      if (key.startsWith("#")) return String.fromCodePoint(Number(key.slice(1)));
      return key in ENTITIES ? ENTITIES[key] : whole;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract h2/h3 entries from rendered markdown HTML, in document order.
 * Headings with no id or no text are skipped — neither can be linked to.
 */
export function extractToc(html: string): TocEntry[] {
  const out: TocEntry[] = [];
  for (const m of html.matchAll(HEADING_RE)) {
    const idMatch = ID_RE.exec(m[2]);
    const id = idMatch?.[1] ?? idMatch?.[2] ?? "";
    if (!id) continue;
    const text = toText(m[3]);
    if (!text) continue;
    out.push({ depth: Number(m[1]), text, id });
  }
  return out;
}
