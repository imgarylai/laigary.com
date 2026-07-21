import { getPublishedPosts, getSiteSettings } from "@/db/queries";

// Server-only: builds the RSS feed XML from the latest published posts. Imported
// by the /feed.xml server route (never bundled to the client).

const DEFAULT_SITE_URL = "https://laigary.com";
const FEED_LIMIT = 50;

export async function buildFeedXml(): Promise<string> {
  const [{ posts }, settings] = await Promise.all([
    getPublishedPosts({ limit: FEED_LIMIT }),
    getSiteSettings(),
  ]);
  const base = (settings.site_url || DEFAULT_SITE_URL).replace(/\/$/, "");

  const items = posts
    .map((post) => {
      const pubDate = new Date(post.date).toUTCString();
      const link = `${base}/posts/${post.slug}`;
      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>${post.excerpt ? `\n      <description><![CDATA[${post.excerpt}]]></description>` : ""}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${settings.site_name || "Blog"}</title>
    <link>${base}</link>
    <description>${settings.site_description || ""}</description>
    <language>${settings.locale || "zh-TW"}</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}
