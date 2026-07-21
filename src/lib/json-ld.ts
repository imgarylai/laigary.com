// schema.org JSON-LD builders for the content detail pages. Pure functions —
// routes serialize the result into a `head:` script tag.

export const SITE_ORIGIN = "https://laigary.com";
const AUTHOR = { "@type": "Person", name: "Gary Lai", url: SITE_ORIGIN } as const;

export interface PostLdInput {
  slug: string;
  title: string;
  excerpt: string | null;
  date: string;
  tags: string[];
  coverImageUrl: string | null;
}

export function blogPostingLd(post: PostLdInput): Record<string, unknown> {
  const url = `${SITE_ORIGIN}/posts/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    datePublished: post.date,
    url,
    mainEntityOfPage: url,
    ...(post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
    image: post.coverImageUrl ?? `${SITE_ORIGIN}/api/og/posts/${post.slug}`,
    inLanguage: "zh-TW",
    author: AUTHOR,
  };
}

export interface NoteLdInput {
  slug: string;
  section: string;
  sectionLabel: string;
  title: string;
  date: string;
  tags: string[];
}

export function techArticleLd(note: NoteLdInput): Record<string, unknown> {
  const url = `${SITE_ORIGIN}/interview/${note.section}/${note.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: note.title,
    datePublished: note.date,
    url,
    mainEntityOfPage: url,
    articleSection: note.sectionLabel,
    ...(note.tags.length > 0 ? { keywords: note.tags.join(", ") } : {}),
    image: `${SITE_ORIGIN}/api/og/interview/${note.section}/${note.slug}`,
    inLanguage: "zh-TW",
    author: AUTHOR,
  };
}

/**
 * Serialize for embedding in a <script> tag. `<` is escaped so content like a
 * title containing `</script>` cannot break out of the tag.
 */
export function serializeJsonLd(ld: Record<string, unknown>): string {
  return JSON.stringify(ld).replaceAll("<", "\\u003c");
}
