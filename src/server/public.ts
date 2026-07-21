import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public (frontend) read server functions. Route loaders call these; queries
// and the markdown renderer are loaded via dynamic import inside each handler so
// none of that server code reaches the client bundle.

const slugInput = (data: unknown) => z.object({ slug: z.string().min(1) }).parse(data);

async function renderMd(md: string): Promise<string> {
  const { renderMarkdown } = await import("@/lib/markdown");
  return renderMarkdown(md);
}

// Default brand name when site_name is unset. Exported for testing.
export const DEFAULT_SITE_NAME = "啟靈工程師";

type InterviewSectionRow = { id: string; slug: string; label: string; blurb: string };

// Pure transform: pair each section with its published-note count (0 when the
// section has no notes). Exported for testing.
export function mapInterviewSections(sections: InterviewSectionRow[], counts: Map<string, number>) {
  return sections.map((s) => ({
    slug: s.slug,
    label: s.label,
    blurb: s.blurb,
    count: counts.get(s.id) ?? 0,
  }));
}

// Minimal metadata for the public shell (header brand). Kept separate so the
// layout loader is cheap.
export const siteMetaFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getSiteSettings } = await import("@/db/queries");
  const s = await getSiteSettings();
  return { siteName: s.site_name || DEFAULT_SITE_NAME };
});

export const homeDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getSiteSettings, getPublishedPosts } = await import("@/db/queries");
  const [settings, { posts }] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts({ limit: 6 }),
  ]);
  return { settings, posts };
});

export const postsDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublishedPosts } = await import("@/db/queries");
  const { posts } = await getPublishedPosts({ limit: 100 });
  return posts;
});

export const postDataFn = createServerFn({ method: "GET" })
  .inputValidator(slugInput)
  .handler(async ({ data }) => {
    const { getPostBySlug } = await import("@/db/queries");
    const post = await getPostBySlug(data.slug);
    if (!post) return null;
    return { post, html: await renderMd(post.contentMd) };
  });

export const tagsDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getTagsWithCounts } = await import("@/db/queries");
  return getTagsWithCounts();
});

export const tagDataFn = createServerFn({ method: "GET" })
  .inputValidator(slugInput)
  .handler(async ({ data }) => {
    const { getPublishedPosts } = await import("@/db/queries");
    const { posts } = await getPublishedPosts({ tag: data.slug, limit: 100 });
    return { slug: data.slug, posts };
  });

export const interviewDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getInterviewSections, getInterviewNoteCountsBySection } = await import("@/db/queries");
  const [sections, counts] = await Promise.all([
    getInterviewSections(),
    getInterviewNoteCountsBySection(),
  ]);
  return mapInterviewSections(sections, counts);
});

export const sectionDataFn = createServerFn({ method: "GET" })
  .inputValidator(slugInput)
  .handler(async ({ data }) => {
    const { getInterviewSectionBySlug, getInterviewNotesBySection } = await import("@/db/queries");
    const section = await getInterviewSectionBySlug(data.slug);
    if (!section) return null;
    const { notes } = await getInterviewNotesBySection(data.slug, { limit: 100 });
    return { section: { slug: section.slug, label: section.label, blurb: section.blurb }, notes };
  });

export const noteDataFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ section: z.string().min(1), slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getInterviewNote } = await import("@/db/queries");
    const note = await getInterviewNote(data.section, data.slug);
    if (!note) return null;
    return { note, html: await renderMd(note.contentMd) };
  });

export const pageDataFn = createServerFn({ method: "GET" })
  .inputValidator(slugInput)
  .handler(async ({ data }) => {
    const { getPageBySlug } = await import("@/db/queries");
    const page = await getPageBySlug(data.slug);
    if (!page) return null;
    return { page: { slug: page.slug, title: page.title }, html: await renderMd(page.contentMd) };
  });
