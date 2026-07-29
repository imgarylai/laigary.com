import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEFAULT_SITE_NAME, pageChrome, pickSocial, renderMd } from "./_shared";

// Interview sub-site read server functions — same Impl/wrapper split as blog.ts.

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

// Per-navigation shell data for the interview namespace: the section list
// (drives the header nav + palette page rows) plus footer branding. Notes are
// searched on demand via `searchInterviewNotesFn` rather than pre-loaded.
export async function interviewShellImpl() {
  const { getInterviewSections, getSiteSettings } = await import("@/db/queries");
  const [sections, settings] = await Promise.all([getInterviewSections(), getSiteSettings()]);
  return {
    sections: sections.map((s) => ({ slug: s.slug, label: s.label })),
    siteName: settings.site_name || DEFAULT_SITE_NAME,
    social: pickSocial(settings),
  };
}

export const interviewShellFn = createServerFn({ method: "GET" }).handler(interviewShellImpl);

// On-demand note search for the interview ⌘K palette (title match across all
// sections). Called only after the user types (and, for IME input, after the
// composition commits) — see CommandPalette.
export async function searchInterviewNotesImpl(data: { q: string }) {
  const { searchPublishedInterviewNotes } = await import("@/db/queries");
  return searchPublishedInterviewNotes(data.q, 20);
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const searchInterviewNotesFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ q: z.string().min(1) }).parse(data))
  .handler(({ data }) => searchInterviewNotesImpl(data));
/* v8 ignore stop */

export async function interviewDataImpl() {
  const { getInterviewSections, getInterviewNoteCountsBySection, getRecentInterviewNotes } =
    await import("@/db/queries");
  const { unixToIso, computeReadingTime } = await import("@/lib/date");
  const [sections, counts, recent] = await Promise.all([
    getInterviewSections(),
    getInterviewNoteCountsBySection(),
    getRecentInterviewNotes(5),
  ]);
  return {
    ...(await pageChrome("Interview")),
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
}

export const interviewDataFn = createServerFn({ method: "GET" }).handler(interviewDataImpl);

/** Rows per page of a section listing. Shared with the route that renders it. */
export const SECTION_PAGE_SIZE = 20;

/**
 * One page of a section listing.
 *
 * Paginated and tag-filtered on the server. It used to fetch 500 notes with
 * their full markdown and let the browser slice 20 out of them, which made
 * this the single most expensive query on the site — and it ran again on every
 * hover preload of a section link.
 *
 * The pinned block is fetched separately and only for page 1 of the unfiltered
 * list, matching where the page renders it.
 */
export async function sectionDataImpl(data: { slug: string; page?: number; tag?: string }) {
  const {
    getInterviewSectionBySlug,
    getInterviewNotesBySection,
    getPinnedInterviewNotes,
    getTagsInSection,
  } = await import("@/db/queries");
  const { unixToIso, computeReadingTime } = await import("@/lib/date");
  const section = await getInterviewSectionBySlug(data.slug);
  if (!section) return null;

  const page = Math.max(1, Math.trunc(data.page ?? 1));
  const tag = data.tag;
  const wantsPinned = page === 1 && !tag;

  const listOpts = {
    tagName: tag,
    // A tag filter competes on tags alone, so pinned notes stay in the list
    // there — the pinned block is hidden while a filter is active.
    excludePinned: !tag,
    limit: SECTION_PAGE_SIZE,
  };

  let [{ notes, total }, pinnedNotes, sectionTags] = await Promise.all([
    getInterviewNotesBySection(data.slug, { ...listOpts, offset: (page - 1) * SECTION_PAGE_SIZE }),
    wantsPinned ? getPinnedInterviewNotes(data.slug) : Promise.resolve([]),
    getTagsInSection(data.slug),
  ]);

  // A hand-edited `?page=` past the end used to land on the last page, back
  // when the browser held the whole list and clamped locally. Re-fetch rather
  // than show an empty list — the extra query only runs on that dead end.
  let resolvedPage = page;
  if (notes.length === 0 && total > 0) {
    resolvedPage = Math.ceil(total / SECTION_PAGE_SIZE);
    ({ notes } = await getInterviewNotesBySection(data.slug, {
      ...listOpts,
      offset: (resolvedPage - 1) * SECTION_PAGE_SIZE,
    }));
  }

  const toRow = (n: (typeof notes)[number]) => ({
    slug: n.slug,
    title: n.title,
    date: unixToIso(n.createdAt),
    minutes: computeReadingTime(n.contentMd),
  });

  return {
    ...(await pageChrome(section.label)),
    section: { slug: section.slug, label: section.label, blurb: section.blurb },
    // Tag names drive the `--filter` chip row, and the `?tag=` value the chips
    // link to — kept as names so URLs already out there keep resolving.
    tags: sectionTags.map((t) => t.name),
    notes: notes.map(toRow),
    pinned: pinnedNotes.map(toRow),
    page: resolvedPage,
    pageSize: SECTION_PAGE_SIZE,
    total,
  };
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const sectionDataFn = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        slug: z.string().min(1),
        page: z.number().int().positive().optional(),
        tag: z.string().min(1).optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => sectionDataImpl(data));
/* v8 ignore stop */

export async function noteDataImpl(data: { section: string; slug: string }) {
  const { getInterviewNote, getInterviewSectionBySlug } = await import("@/db/queries");
  const { unixToIso, computeReadingTime } = await import("@/lib/date");
  const { extractToc } = await import("@/lib/toc");
  const note = await getInterviewNote(data.section, data.slug);
  if (!note) return null;
  const section = await getInterviewSectionBySlug(data.section);
  const html = await renderMd(note.contentMd);
  return {
    note: {
      slug: note.slug,
      section: data.section,
      sectionLabel: section?.label ?? data.section,
      title: note.title,
      date: unixToIso(note.createdAt),
      updatedAt: unixToIso(note.updatedAt),
      minutes: computeReadingTime(note.contentMd),
      // Keep {name, slug} so the detail page can link tags to the unified
      // /tags/$slug page; the JSON-LD head maps these back to bare names.
      tags: note.tags,
    },
    html,
    toc: extractToc(html),
    ...(await pageChrome(note.title)),
  };
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const noteDataFn = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ section: z.string().min(1), slug: z.string().min(1) }).parse(data),
  )
  .handler(({ data }) => noteDataImpl(data));
/* v8 ignore stop */
