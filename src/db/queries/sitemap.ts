import { eq, desc, asc, max } from "drizzle-orm";
import {
  posts,
  postTags,
  tags,
  interviewSections,
  interviewNotes,
  interviewNoteTags,
  pages,
  works,
  workTags,
} from "@/db/schema";
import { getDb } from "./_db";
import { liveNotes, livePosts } from "./_visibility";

export type SitemapData = {
  posts: { slug: string; updatedAt: number }[];
  tags: { slug: string; updatedAt: number }[];
  sections: { slug: string; updatedAt: number }[];
  notes: { slug: string; sectionSlug: string; updatedAt: number }[];
  works: { slug: string; updatedAt: number }[];
  pages: { slug: string; updatedAt: number }[];
};

// Everything the public sitemap needs, in one pass: LIVE posts/notes (a
// scheduled one is not crawlable yet, so listing it would advertise a 404), the
// pages, and tags/sections carrying the latest updatedAt of their published
// content (tags/sections with no published content are dropped).
export async function getSitemapData(): Promise<SitemapData> {
  const db = await getDb();

  const [postRows, noteRows, sectionRows, tagRows, noteTagRows, workRows, workTagRows, pageRows] =
    await Promise.all([
      db
        .select({ slug: posts.slug, updatedAt: posts.updatedAt })
        .from(posts)
        .where(livePosts())
        .orderBy(desc(posts.publishedAt)),
      db
        .select({
          slug: interviewNotes.slug,
          sectionSlug: interviewSections.slug,
          updatedAt: interviewNotes.updatedAt,
        })
        .from(interviewNotes)
        .innerJoin(interviewSections, eq(interviewSections.id, interviewNotes.sectionId))
        .where(liveNotes())
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
        .where(livePosts())
        .groupBy(tags.slug),
      db
        .select({ tagSlug: tags.slug, updatedAt: max(interviewNotes.updatedAt) })
        .from(interviewNoteTags)
        .innerJoin(interviewNotes, eq(interviewNotes.id, interviewNoteTags.noteId))
        .innerJoin(tags, eq(tags.id, interviewNoteTags.tagId))
        .where(liveNotes())
        .groupBy(tags.slug),
      db
        .select({ slug: works.slug, updatedAt: works.updatedAt })
        .from(works)
        .where(eq(works.status, "published"))
        .orderBy(desc(works.pinned), desc(works.year)),
      db
        .select({ tagSlug: tags.slug, updatedAt: max(works.updatedAt) })
        .from(workTags)
        .innerJoin(works, eq(works.id, workTags.workId))
        .innerJoin(tags, eq(tags.id, workTags.tagId))
        .where(eq(works.status, "published"))
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

  // Merge post-, note- and work-tag latest timestamps into one unified tag set
  // — the /tags/$slug page lists all three, so all three must be crawlable and
  // a tag's lastmod must move when any of them is edited.
  const tagLatest = new Map<string, number>();
  for (const r of [...tagRows, ...noteTagRows, ...workTagRows]) {
    if (r.updatedAt) tagLatest.set(r.tagSlug, Math.max(tagLatest.get(r.tagSlug) ?? 0, r.updatedAt));
  }
  const tagsWithLatest = [...tagLatest].map(([slug, updatedAt]) => ({ slug, updatedAt }));

  return {
    posts: postRows,
    tags: tagsWithLatest,
    sections,
    notes: noteRows,
    works: workRows,
    pages: pageRows,
  };
}
