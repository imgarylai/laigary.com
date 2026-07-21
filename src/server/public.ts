import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { socialUrl } from "@/lib/social";

// Public (frontend) read server functions. Route loaders call these; queries
// and the markdown renderer are loaded via dynamic import inside each handler so
// none of that server code reaches the client bundle.

const slugInput = (data: unknown) => z.object({ slug: z.string().min(1) }).parse(data);

async function renderMd(md: string): Promise<string> {
  const { renderMarkdown } = await import("@/lib/markdown");
  return renderMarkdown(md);
}

// Browser-tab title for a content page, honoring the `title_template` setting
// (`%s | Site` style — see lib/site-title). Fetches settings itself so detail
// server fns can build the final string in one place.
async function pageTitle(title: string): Promise<string> {
  const { getSiteSettings } = await import("@/db/queries");
  const { formatPageTitle } = await import("@/lib/site-title");
  const settings = await getSiteSettings();
  const siteName = settings.site_name || DEFAULT_SITE_NAME;
  return formatPageTitle(settings.title_template ?? "", title, siteName);
}

// Default brand name when site_name is unset. Exported for testing.
export const DEFAULT_SITE_NAME = "Unconstrained";

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

// ── Blog main site ──────────────────────────────────────────────────────

// Footer social links resolved to absolute hrefs via lib/social (settings
// store bare handles; unset ones come through as null and drop out in the
// footer). Exported for testing.
export function pickSocial(settings: Record<string, string>) {
  return {
    github: socialUrl("author_github", settings.author_github ?? ""),
    twitter: socialUrl("author_twitter", settings.author_twitter ?? ""),
    linkedin: socialUrl("author_linkedin", settings.author_linkedin ?? ""),
    email: settings.author_email ? `mailto:${settings.author_email}` : null,
  };
}

// Per-navigation shell data: brand name + footer social links. The command
// palette used to receive the whole post index here (pre-loaded on every
// navigation); it now searches posts on demand via `searchPostsFn`, so the
// shell stays lightweight.
export const blogShellFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getSiteSettings } = await import("@/db/queries");
  const settings = await getSiteSettings();
  return { siteName: settings.site_name || DEFAULT_SITE_NAME, social: pickSocial(settings) };
});

// Home: whoami/intro from settings + headline counts and latest-post date.
export const homeDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getSiteSettings, getPublishedPosts, getTagsWithCounts } = await import("@/db/queries");
  const [settings, { posts, total }, tags] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts({ limit: 1 }),
    getTagsWithCounts(),
  ]);
  const whoami = [settings.author_name, settings.author_role, settings.author_location]
    .filter(Boolean)
    .join(" · ");
  const social = pickSocial(settings);
  const socialUrls = [social.github, social.twitter, social.linkedin].filter(
    (u): u is string => u !== null,
  );

  return {
    siteName: settings.site_name || DEFAULT_SITE_NAME,
    whoami: settings.whoami || whoami,
    intro: settings.site_description || "",
    postCount: total,
    tagCount: tags.length,
    latestDate: posts[0]?.date ?? null,
    // Absolute profile URLs for the home page's JSON-LD Person.sameAs.
    socialUrls,
  };
});

// Archive: full published list (blog scale is small); the client paginates and
// applies the `?tag=` filter from typed search params.
export const postsDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublishedPosts } = await import("@/db/queries");
  const { posts } = await getPublishedPosts({ limit: 500 });
  return posts;
});

export const postDataFn = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(async ({ data }) => {
    const { getPostBySlug } = await import("@/db/queries");
    const { extractToc } = await import("@/lib/toc");
    const post = await getPostBySlug(data.slug);
    if (!post) return null;
    return {
      post,
      html: await renderMd(post.contentMd),
      toc: extractToc(post.contentMd),
      pageTitle: await pageTitle(post.title),
    };
  });

export const tagsDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getTagsWithCounts } = await import("@/db/queries");
  return getTagsWithCounts();
});

export const pageDataFn = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(async ({ data }) => {
    const { getPageBySlug } = await import("@/db/queries");
    const page = await getPageBySlug(data.slug);
    if (!page) return null;
    return {
      page: { slug: page.slug, title: page.title },
      html: await renderMd(page.contentMd),
      pageTitle: await pageTitle(page.title),
    };
  });

// ── Interview sub-site ──────────────────────────────────────────────────

// Per-navigation shell data for the interview namespace: the section list
// (drives the header nav + palette page rows) plus footer branding. Notes are
// searched on demand via `searchInterviewNotesFn` rather than pre-loaded.
export const interviewShellFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getInterviewSections, getSiteSettings } = await import("@/db/queries");
  const [sections, settings] = await Promise.all([getInterviewSections(), getSiteSettings()]);
  return {
    sections: sections.map((s) => ({ slug: s.slug, label: s.label })),
    siteName: settings.site_name || DEFAULT_SITE_NAME,
    social: pickSocial(settings),
  };
});

// On-demand note search for the interview ⌘K palette (title match across all
// sections). Called only after the user types (and, for IME input, after the
// composition commits) — see CommandPalette.
export const searchInterviewNotesFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ q: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { searchPublishedInterviewNotes } = await import("@/db/queries");
    return searchPublishedInterviewNotes(data.q, 20);
  });

export const interviewDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getInterviewSections, getInterviewNoteCountsBySection, getRecentInterviewNotes } =
    await import("@/db/queries");
  const { unixToIso, computeReadingTime } = await import("@/lib/date");
  const [sections, counts, recent] = await Promise.all([
    getInterviewSections(),
    getInterviewNoteCountsBySection(),
    getRecentInterviewNotes(5),
  ]);
  return {
    sections: mapInterviewSections(sections, counts).map((s, i) => ({
      ...s,
      icon: sections[i].icon,
    })),
    recent: recent.map((n) => ({
      slug: n.slug,
      title: n.title,
      section: sections.find((s) => s.id === n.sectionId)?.slug ?? "",
      date: unixToIso(n.createdAt),
      minutes: computeReadingTime(n.contentMd),
      tags: n.tags.map((t) => t.name),
    })),
  };
});

export const sectionDataFn = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(async ({ data }) => {
    const { getInterviewSectionBySlug, getInterviewNotesBySection } = await import("@/db/queries");
    const { unixToIso, computeReadingTime } = await import("@/lib/date");
    const section = await getInterviewSectionBySlug(data.slug);
    if (!section) return null;
    const { notes } = await getInterviewNotesBySection(data.slug, { limit: 500 });
    return {
      pageTitle: await pageTitle(section.label),
      section: { slug: section.slug, label: section.label, blurb: section.blurb },
      notes: notes.map((n) => ({
        slug: n.slug,
        title: n.title,
        date: unixToIso(n.createdAt),
        minutes: computeReadingTime(n.contentMd),
        tags: n.tags.map((t) => t.name),
      })),
    };
  });

export const noteDataFn = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ section: z.string().min(1), slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getInterviewNote, getInterviewSectionBySlug } = await import("@/db/queries");
    const { unixToIso, computeReadingTime } = await import("@/lib/date");
    const note = await getInterviewNote(data.section, data.slug);
    if (!note) return null;
    const section = await getInterviewSectionBySlug(data.section);
    return {
      note: {
        slug: note.slug,
        section: data.section,
        sectionLabel: section?.label ?? data.section,
        title: note.title,
        date: unixToIso(note.createdAt),
        minutes: computeReadingTime(note.contentMd),
        tags: note.tags.map((t) => t.name),
      },
      html: await renderMd(note.contentMd),
      pageTitle: await pageTitle(note.title),
    };
  });
