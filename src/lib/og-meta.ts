// Open Graph / Twitter meta tags for the head() of content routes. Facebook &
// co. read these — not JSON-LD — so every shareable page must carry them
// explicitly (the FB debugger warns on a missing og:image otherwise).

export interface OgMetaInput {
  /** Bare content title — og:site_name carries the site, so no template here. */
  title: string;
  siteName: string;
  /** Absolute canonical URL of the page. */
  url: string;
  /** Absolute image URL (an /api/og* endpoint or a cover image). */
  image: string;
  type: "website" | "article";
  description?: string;
}

export function ogMeta(input: OgMetaInput): Array<Record<string, string>> {
  const tags: Array<Record<string, string>> = [
    { property: "og:title", content: input.title },
    { property: "og:site_name", content: input.siteName },
    { property: "og:url", content: input.url },
    { property: "og:image", content: input.image },
    { property: "og:type", content: input.type },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:image", content: input.image },
  ];
  if (input.description) {
    tags.push(
      { name: "description", content: input.description },
      { property: "og:description", content: input.description },
      { name: "twitter:description", content: input.description },
    );
  }
  return tags;
}
