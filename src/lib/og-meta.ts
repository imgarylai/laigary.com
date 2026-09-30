import { BRAND_CANVAS } from "@/lib/brand";
import { truncateSummary } from "@/lib/summary";
import { OG_DESIGN_VERSION } from "@/lib/og/version";

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
  /** Description of a custom cover; generated title cards default to their title. */
  imageAlt?: string;
  type: "website" | "article";
  description?: string;
  /** ISO publish date; emitted as article:published_time for articles. */
  publishedTime?: string;
  /** ISO last-edit date; emitted as article:modified_time for articles. */
  modifiedTime?: string;
}

// The canonical <link> entry for a public route's head() links. Search engines
// honor this — not og:url — for canonicalization. Routes pass the same clean
// absolute URL they give ogMeta; search params (?tag, ?page) never leak in
// because head() doesn't depend on them.
export function canonicalLink(url: string): Array<Record<string, string>> {
  return [{ rel: "canonical", href: url }];
}

// The markdown twin of a content page, which lives at the page's own URL plus
// `.md` (served by `server/md.ts`, wired in `src/start.ts`). Declaring it as a
// typed alternate is how an agent that wants the source instead of the rendered
// HTML finds it without guessing the convention — and it is what tells a
// crawler the two URLs are one document, the other half of the `rel=canonical`
// header the markdown response carries back.
export function markdownAlternateLink(url: string): Array<Record<string, string>> {
  return [{ rel: "alternate", type: "text/markdown", href: `${url}.md` }];
}

export function ogMeta(input: OgMetaInput): Array<Record<string, string>> {
  // Our /api/og* endpoints always render 1200×630. Explicit dimensions let
  // crawlers show the card on the very first share, before the image has been
  // processed asynchronously. Cover images have unknown dimensions — claiming
  // wrong ones is worse than omitting them, so those get no size tags.
  const imageUrl = new URL(input.image);
  const isOwnOgEndpoint =
    imageUrl.origin === new URL(input.url).origin && /^\/api\/og(?:\/|$)/.test(imageUrl.pathname);
  if (isOwnOgEndpoint) {
    imageUrl.searchParams.set("v", OG_DESIGN_VERSION);
    if (input.modifiedTime) imageUrl.searchParams.set("updated", input.modifiedTime);
  }
  const image = isOwnOgEndpoint ? imageUrl.toString() : input.image;
  const imageAlt = input.imageAlt || input.title;
  const tags: Array<Record<string, string>> = [
    { name: "theme-color", content: BRAND_CANVAS },
    { property: "og:title", content: input.title },
    { property: "og:site_name", content: input.siteName },
    { property: "og:url", content: input.url },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: imageAlt },
    ...(isOwnOgEndpoint
      ? [
          { property: "og:image:type", content: "image/png" },
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
        ]
      : []),
    { property: "og:type", content: input.type },
    // Content locale (matches the JSON-LD inLanguage declaration).
    { property: "og:locale", content: "zh_TW" },
    ...(input.type === "article" && input.publishedTime
      ? [{ property: "article:published_time", content: input.publishedTime }]
      : []),
    ...(input.type === "article" && input.modifiedTime
      ? [{ property: "article:modified_time", content: input.modifiedTime }]
      : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@imgarylai" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
  ];
  if (input.description) {
    const description = truncateSummary(input.description);
    tags.push(
      { name: "description", content: description },
      { property: "og:description", content: description },
      { name: "twitter:description", content: description },
    );
  }
  return tags;
}
