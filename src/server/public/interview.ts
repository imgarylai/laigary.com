import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEFAULT_SITE_NAME, pageChrome, pickSocial, renderMd, slugInput } from "./_shared";

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

export const searchInterviewNotesFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ q: z.string().min(1) }).parse(data))
  .handler(({ data }) => searchInterviewNotesImpl(data));

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

export async function sectionDataImpl(data: { slug: string }) {
  const { getInterviewSectionBySlug, getInterviewNotesBySection, getTagsInSection } =
    await import("@/db/queries");
  const { unixToIso, computeReadingTime } = await import("@/lib/date");
  const section = await getInterviewSectionBySlug(data.slug);
  if (!section) return null;
  const [{ notes }, sectionTags] = await Promise.all([
    getInterviewNotesBySection(data.slug, { limit: 500 }),
    getTagsInSection(data.slug),
  ]);
  return {
    ...(await pageChrome(section.label)),
    section: { slug: section.slug, label: section.label, blurb: section.blurb },
    // Tag names drive the `--filter` chip row; notes carry names too, so the
    // `?tag=` filter matches by name (consistent with note-detail tag links).
    tags: sectionTags.map((t) => t.name),
    notes: notes.map((n) => ({
      slug: n.slug,
      title: n.title,
      date: unixToIso(n.createdAt),
      minutes: computeReadingTime(n.contentMd),
      tags: n.tags.map((t) => t.name),
    })),
  };
}

export const sectionDataFn = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(({ data }) => sectionDataImpl(data));

export async function noteDataImpl(data: { section: string; slug: string }) {
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
      updatedAt: unixToIso(note.updatedAt),
      minutes: computeReadingTime(note.contentMd),
      // Keep {name, slug} so the detail page can link tags to the unified
      // /tags/$slug page; the JSON-LD head maps these back to bare names.
      tags: note.tags,
    },
    html: await renderMd(note.contentMd),
    ...(await pageChrome(note.title)),
  };
}

export const noteDataFn = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ section: z.string().min(1), slug: z.string().min(1) }).parse(data),
  )
  .handler(({ data }) => noteDataImpl(data));
