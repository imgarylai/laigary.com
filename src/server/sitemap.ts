import { getSitemapData, getSiteSettings } from "@/db/queries";

// Server-only: builds the public sitemap XML from DB content. Imported by the
// /sitemap.xml server route (never bundled to the client), so a static query
// import is fine here.

const DEFAULT_SITE_URL = "https://laigary.com";

function isoDate(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

type Entry = { loc: string; lastmod?: number; priority: number };

export async function buildSitemapXml(): Promise<string> {
  const [data, settings] = await Promise.all([getSitemapData(), getSiteSettings()]);
  const base = (settings.site_url || DEFAULT_SITE_URL).replace(/\/$/, "");

  const entries: Entry[] = [{ loc: `${base}/`, priority: 1 }];
  for (const path of ["/posts", "/tags", "/interview"]) {
    entries.push({ loc: `${base}${path}`, priority: 0.6 });
  }
  for (const p of data.posts) {
    entries.push({ loc: `${base}/posts/${p.slug}`, lastmod: p.updatedAt, priority: 0.8 });
  }
  for (const t of data.tags) {
    entries.push({ loc: `${base}/tags/${t.slug}`, lastmod: t.updatedAt, priority: 0.5 });
  }
  for (const s of data.sections) {
    entries.push({ loc: `${base}/interview/${s.slug}`, lastmod: s.updatedAt, priority: 0.6 });
  }
  for (const n of data.notes) {
    entries.push({
      loc: `${base}/interview/${n.sectionSlug}/${n.slug}`,
      lastmod: n.updatedAt,
      priority: 0.7,
    });
  }
  for (const pg of data.pages) {
    entries.push({ loc: `${base}/${pg.slug}`, lastmod: pg.updatedAt, priority: 0.6 });
  }

  const body = entries
    .map(
      (e) =>
        `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${isoDate(e.lastmod)}</lastmod>` : ""}<priority>${e.priority}</priority></url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}
