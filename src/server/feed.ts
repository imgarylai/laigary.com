import { getFeedPosts, getSiteSettings } from "@/db/queries";
import { renderMarkdown } from "@/lib/markdown";

// Server-only: builds the RSS feed XML from the latest published posts. Imported
// by the /feed.xml server route (never bundled to the client).

const DEFAULT_SITE_URL = "https://laigary.com";
const FEED_LIMIT = 50;
const DESCRIPTION_MAX = 280;

// A `]]>` inside content would close the CDATA section early; split it across
// two sections so the payload survives verbatim.
function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

// Fallback description when a post has no excerpt: the rendered body with tags
// stripped and whitespace collapsed, truncated.
function plainTextSummary(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > DESCRIPTION_MAX ? `${text.slice(0, DESCRIPTION_MAX)}…` : text;
}

export async function buildFeedXml(): Promise<string> {
  const [posts, settings] = await Promise.all([getFeedPosts(FEED_LIMIT), getSiteSettings()]);
  const base = (settings.site_url || DEFAULT_SITE_URL).replace(/\/$/, "");

  const items = await Promise.all(
    posts.map(async (post) => {
      const pubDate = new Date(post.date).toUTCString();
      const link = `${base}/posts/${post.slug}`;
      const html = await renderMarkdown(post.contentMd);
      const description = post.excerpt || plainTextSummary(html);
      return `    <item>
      <title>${cdata(post.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${cdata(description)}</description>
      <content:encoded>${cdata(html)}</content:encoded>
    </item>`;
    }),
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${settings.site_name || "Blog"}</title>
    <link>${base}</link>
    <description>${settings.site_description || ""}</description>
    <language>${settings.locale || "zh-TW"}</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>`;
}
