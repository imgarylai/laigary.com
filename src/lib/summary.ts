// Plain-text summary of rendered HTML: tags stripped, whitespace collapsed,
// truncated with an ellipsis. The fallback description for content without an
// explicit excerpt — the RSS feed and the meta/OG description both use it.

export const FEED_SUMMARY_MAX = 280;
export const META_SUMMARY_MAX = 160;

export function plainTextSummary(html: string, max: number): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return truncateSummary(text, max);
}

/** Include the ellipsis in the budget and never split a Unicode code point. */
export function truncateSummary(text: string, max = META_SUMMARY_MAX): string {
  const characters = Array.from(text);
  if (characters.length <= max) return text;
  if (max <= 0) return "";
  return `${characters
    .slice(0, max - 1)
    .join("")
    .trimEnd()}…`;
}
