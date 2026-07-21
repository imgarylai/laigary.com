import { eq, desc, asc, max } from "drizzle-orm";
import { posts, postTags, tags, interviewSections, interviewNotes, pages } from "@/db/schema";
import { getDb } from "./_db";

export type SitemapData = {
  posts: { slug: string; updatedAt: number }[];
  tags: { slug: string; updatedAt: number }[];
  sections: { slug: string; updatedAt: number }[];
  notes: { slug: string; sectionSlug: string; updatedAt: number }[];
  pages: { slug: string; updatedAt: number }[];
};

// Everything the public sitemap needs, in one pass: published posts/notes, the
// pages, and tags/sections carrying the latest updatedAt of their published
// content (tags/sections with no published content are dropped).
export async function getSitemapData(): Promise<SitemapData> {
  const db = await getDb();

  const [postRows, noteRows, sectionRows, tagRows, pageRows] = await Promise.all([
    db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt)),
    db
      .select({
        slug: interviewNotes.slug,
        sectionSlug: interviewSections.slug,
        updatedAt: interviewNotes.updatedAt,
      })
      .from(interviewNotes)
      .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
      .where(eq(interviewNotes.status, "published"))
      .orderBy(desc(interviewNotes.publishedAt)),
    db
      .select({ slug: interviewSections.slug })
      .from(interviewSections)
      .orderBy(asc(interviewSections.sortOrder)),
    db
      .select({ tagSlug: tags.slug, updatedAt: max(posts.updatedAt) })
      .from(postTags)
      .innerJoin(posts, eq(posts.id, postTags.postId))
      .innerJoin(tags, eq(tags.id, postTags.tagId))
      .where(eq(posts.status, "published"))
      .groupBy(tags.slug),
    db.select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages),
  ]);

  // Latest published-note updatedAt per section (drop sections with no notes).
  const sectionLatest = new Map<string, number>();
  for (const n of noteRows) {
    sectionLatest.set(n.sectionSlug, Math.max(sectionLatest.get(n.sectionSlug) ?? 0, n.updatedAt));
  }
  const sections = sectionRows.flatMap((s) => {
    const ts = sectionLatest.get(s.slug);
    return ts ? [{ slug: s.slug, updatedAt: ts }] : [];
  });

  const tagsWithLatest = tagRows.flatMap((r) =>
    r.updatedAt ? [{ slug: r.tagSlug, updatedAt: r.updatedAt }] : [],
  );

  return { posts: postRows, tags: tagsWithLatest, sections, notes: noteRows, pages: pageRows };
}
