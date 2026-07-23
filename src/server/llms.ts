import {
  getInterviewSections,
  getPublishedNoteIndex,
  getPublishedPosts,
  getPagesList,
  getSiteSettings,
} from "@/db/queries";

// Server-only: builds the /llms.txt content map (https://llmstxt.org) so AI
// crawlers without MCP support still get a structured index of the site. The
// MCP endpoint at /mcp stays the richer programmatic surface.

const DEFAULT_SITE_URL = "https://laigary.com";
const POSTS_LIMIT = 500;

export async function buildLlmsTxt(): Promise<string> {
  const [settings, { posts }, pages, sections, notes] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts({ limit: POSTS_LIMIT }),
    getPagesList(),
    getInterviewSections(),
    getPublishedNoteIndex(),
  ]);
  const base = (settings.site_url || DEFAULT_SITE_URL).replace(/\/$/, "");
  const siteName = settings.site_name || "Unconstrained";

  const lines: string[] = [`# ${siteName}`];
  if (settings.site_description) lines.push("", `> ${settings.site_description}`);
  lines.push(
    "",
    `Personal blog and interview-prep notes. Machine-readable indexes: ${base}/sitemap.xml, ${base}/feed.xml (full-content RSS). ` +
      `A Model Context Protocol endpoint lives at ${base}/mcp (streamable HTTP; read tools are public).`,
  );

  if (posts.length > 0) {
    lines.push("", "## Posts", "");
    for (const post of posts) {
      const excerpt = post.excerpt ? `: ${post.excerpt}` : "";
      lines.push(`- [${post.title}](${base}/posts/${post.slug})${excerpt}`);
    }
  }

  if (pages.length > 0) {
    lines.push("", "## Pages", "");
    for (const page of pages) {
      lines.push(`- [${page.title}](${base}/${page.slug})`);
    }
  }

  if (notes.length > 0) {
    lines.push("", "## Interview notes", "");
    const labelBySlug = new Map(sections.map((s) => [s.slug, s.label]));
    for (const note of notes) {
      const label = labelBySlug.get(note.sectionSlug) ?? note.sectionSlug;
      lines.push(`- [${label}: ${note.title}](${base}/interview/${note.sectionSlug}/${note.slug})`);
    }
  }

  return `${lines.join("\n")}\n`;
}
