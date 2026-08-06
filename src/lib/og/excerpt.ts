// Plain-text opening of an article, for the OG card. Framework-free and
// unit-testable, like the templates it feeds.

/**
 * Display width of one code point, in half-width units.
 *
 * A card line fits a fixed number of *columns*, not characters — a CJK glyph
 * occupies two of them. Budgeting by `String.length` would mean an English
 * excerpt fills the line while a Chinese one of the same length runs off the
 * edge, or the reverse: a Chinese excerpt cut to the English budget looks half
 * as long as it should. Ranges follow the usual East Asian Wide/Fullwidth
 * tables, which is close enough for prose.
 */
function charWidth(codePoint: number): number {
  const wide =
    (codePoint >= 0x1100 && codePoint <= 0x115f) || // Hangul Jamo
    (codePoint >= 0x2e80 && codePoint <= 0x303e) || // CJK radicals, kana punctuation
    (codePoint >= 0x3041 && codePoint <= 0x33ff) || // kana, CJK compatibility
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) || // CJK ext A
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) || // CJK unified
    (codePoint >= 0xa000 && codePoint <= 0xa4cf) || // Yi
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) || // Hangul syllables
    (codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK compatibility ideographs
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) || // CJK compatibility forms
    (codePoint >= 0xff00 && codePoint <= 0xff60) || // fullwidth forms
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd); // CJK ext B and beyond
  return wide ? 2 : 1;
}

/** Total display width of a string, in half-width units. */
export function displayWidth(text: string): number {
  let total = 0;
  for (const ch of text) total += charWidth(ch.codePointAt(0) ?? 0);
  return total;
}

/** Cut to at most `maxWidth` columns, adding an ellipsis when anything is lost. */
export function truncateToWidth(text: string, maxWidth: number): string {
  if (displayWidth(text) <= maxWidth) return text;
  // Leave room for the ellipsis so the result still fits the budget.
  const budget = maxWidth - 1;
  let out = "";
  let width = 0;
  for (const ch of text) {
    const w = charWidth(ch.codePointAt(0) ?? 0);
    if (width + w > budget) break;
    out += ch;
    width += w;
  }
  return `${out.trimEnd()}…`;
}

// Blocks that carry no prose worth quoting, stripped whole.
const DROPPED_BLOCKS = [
  /^```[\s\S]*?^```$/gm, // fenced code
  /^\s*\|.*\|\s*$/gm, // table rows
  /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, // thematic breaks
  /<!--[\s\S]*?-->/g, // html comments
  /<[^>\n]+>/g, // raw html tags
];

// Inline markup reduced to the text it decorates.
const INLINE_RULES: readonly (readonly [RegExp, string])[] = [
  [/!\[[^\]]*\]\([^)]*\)/g, ""], // images carry no text
  [/\[([^\]]*)\]\([^)]*\)/g, "$1"], // links keep their label
  [/`([^`]+)`/g, "$1"], // inline code keeps its content
  [/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1"], // emphasis
  [/~~([^~]+)~~/g, "$1"], // strikethrough
  [/^\s{0,3}#{1,6}\s+/gm, ""], // heading markers
  [/^\s{0,3}>\s?/gm, ""], // blockquote markers
  [/^\s*(?:[-*+]|\d+[.)])\s+/gm, ""], // list markers
];

/**
 * The opening prose of a markdown document, flattened to plain text and cut to
 * `maxWidth` display columns.
 *
 * Headings are stripped rather than skipped: an article that opens with one
 * would otherwise start its card with a line the title already says.
 */
export function plainExcerpt(markdown: string, maxWidth: number): string {
  let text = markdown;
  for (const pattern of DROPPED_BLOCKS) text = text.replace(pattern, "");
  for (const [pattern, replacement] of INLINE_RULES) text = text.replace(pattern, replacement);
  // Collapse every run of whitespace, newlines included: the card is one
  // flowing paragraph, not a transcript of the source's line breaks.
  text = text.replace(/\s+/g, " ").trim();
  return truncateToWidth(text, maxWidth);
}
