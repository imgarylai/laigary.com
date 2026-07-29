import {
  getInterviewSections,
  getPublishedNoteIndex,
  getPublishedPosts,
  getPublishedWorks,
  getPagesList,
  getSiteSettings,
} from "@/db/queries";
import { fmtYearRange } from "@/lib/date";

// Server-only: builds the /llms.txt content map (https://llmstxt.org) so AI
// crawlers without MCP support still get a structured index of the site. The
// MCP endpoint at /mcp stays the richer programmatic surface.

const DEFAULT_SITE_URL = "https://laigary.com";
const POSTS_LIMIT = 500;
const WORKS_LIMIT = 200;

export async function buildLlmsTxt(): Promise<string> {
  const [settings, { posts }, { works }, pages, sections, notes] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts({ limit: POSTS_LIMIT }),
    getPublishedWorks({ limit: WORKS_LIMIT }),
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

  if (works.length > 0) {
    lines.push("", "## Works", "");
    for (const work of works) {
      // Year and summary both go inline: for a portfolio entry those are the
      // two facts a crawler has no other way to get without fetching the page.
      const summary = work.summary ? `: ${work.summary}` : "";
      const year = fmtYearRange(work.year, work.endYear);
      lines.push(`- [${work.title} (${year})](${base}/works/${work.slug})${summary}`);
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
