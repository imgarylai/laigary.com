import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  AdminInterviewNote,
  AdminPost,
  AdminPostDetail,
  AdminWork,
  AdminWorkDetail,
  PageListItem,
  Tag,
  TagWithUsage,
} from "@/db/queries";

type PageDetail = { id: string; slug: string; title: string; contentMd: string } | null;

type SectionOption = { id: string; label: string; slug: string };
type NoteDetail = {
  id: string;
  slug: string;
  sectionId: string;
  title: string;
  contentMd: string;
  status: "draft" | "published";
  pinned: boolean;
  publishedAt: number | null;
  tagIds: string[];
} | null;

// Read-side server functions the admin route loaders call. Reads must run on the
// server (D1 binding), so the query layer is loaded with a dynamic import INSIDE
// each handler — never a static top-level import. A static import would pin the
// query modules (and their `cloudflare:workers` binding access) into the client
// bundle, since createServerFn keeps the handler closure client-side.
//
// Same split as the mutations: the exported `*Impl` functions hold the logic
// and are unit-tested against the better-sqlite3 harness; the createServerFn
// wrappers are the thin RPC boundary.

// The OG preview footer shown in the cover-image picker. Kept in sync with the
// real SEO metadata by deriving it from site_settings instead of hardcoding.
// Exported for testing.
export function computeOgBrand(settings: Record<string, string>): string {
  const name = settings.site_name || "Unconstrained";
  let host = "";
  try {
    host = settings.site_url ? new URL(settings.site_url).host : "";
  } catch {
    host = "";
  }
  return host ? `${name} | ${host}` : name;
}

// Dashboard content counts (published/draft posts, notes, pages, tags).
export async function dashboardStatsImpl() {
  const { getDashboardStats } = await import("@/db/queries");
  return getDashboardStats();
}

export const dashboardStatsFn = createServerFn({ method: "GET" }).handler(dashboardStatsImpl);

// The admin posts table searches / sorts / paginates client-side, so the loader
// takes the full list.
export async function listPostsImpl(): Promise<AdminPost[]> {
  const { getAllAdminPosts } = await import("@/db/queries");
  return getAllAdminPosts();
}

export const listPostsFn = createServerFn({ method: "GET" }).handler(listPostsImpl);

// Tags admin list — every tag with its usage counts + what uses it.
export async function listTagsImpl(): Promise<TagWithUsage[]> {
  const { getTagsWithUsage } = await import("@/db/queries");
  return getTagsWithUsage();
}

export const listTagsFn = createServerFn({ method: "GET" }).handler(listTagsImpl);

type SectionRow = {
  id: string;
  slug: string;
  label: string;
  blurb: string;
  icon: string;
  sortOrder: number;
  noteCount: number;
};

// Interview sections + how many notes each holds (deleting a section cascades to
// its notes, so the list surfaces the count as a warning).
export async function listSectionsImpl(): Promise<SectionRow[]> {
  const { getInterviewSections, getInterviewNoteCountsBySection } = await import("@/db/queries");
  const [sections, counts] = await Promise.all([
    getInterviewSections(),
    getInterviewNoteCountsBySection(),
  ]);
  return sections.map((s) => ({
    id: s.id,
    slug: s.slug,
    label: s.label,
    blurb: s.blurb,
    icon: s.icon,
    sortOrder: s.sortOrder,
    noteCount: counts.get(s.id) ?? 0,
  }));
}

export const listSectionsFn = createServerFn({ method: "GET" }).handler(listSectionsImpl);

// Interview notes admin list — one page, filtered and sorted in SQL. The route
// passes its search params straight through, so the URL is the query.
export async function listNotesImpl(data?: {
  q?: string;
  page?: number;
  sort?: string;
  dir?: "asc" | "desc";
  /** Section slug, as it appears in the URL. */
  section?: string;
  status?: string;
}): Promise<{
  items: AdminInterviewNote[];
  total: number;
  pageSize: number;
  sections: SectionOption[];
}> {
  const { getAdminInterviewNotes, getInterviewSections, isAdminNoteSort, ADMIN_NOTES_PAGE_SIZE } =
    await import("@/db/queries");
  const page = Math.max(1, data?.page ?? 1);
  // The section dropdown needs the full list whatever the filter is; the query
  // is cached, so carrying it on the list loader costs nothing per keystroke.
  const sectionRows = await getInterviewSections();
  const { items, total } = await getAdminInterviewNotes({
    q: data?.q,
    // A slug nobody has (a renamed or hand-typed one) falls back to the
    // unfiltered list rather than to an empty table that looks like a bug.
    sectionId: sectionRows.find((s) => s.slug === data?.section)?.id,
    status: data?.status,
    // An unknown `sort` in a hand-edited URL falls back to the default rather
    // than erroring — the column set is a UI detail, not a contract.
    sort: isAdminNoteSort(data?.sort) ? data.sort : undefined,
    dir: data?.dir,
    limit: ADMIN_NOTES_PAGE_SIZE,
    offset: (page - 1) * ADMIN_NOTES_PAGE_SIZE,
  });
  return {
    items,
    total,
    pageSize: ADMIN_NOTES_PAGE_SIZE,
    sections: sectionRows.map((s) => ({ id: s.id, label: s.label, slug: s.slug })),
  };
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const listNotesFn = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        q: z.string().optional(),
        page: z.number().int().positive().optional(),
        sort: z.string().optional(),
        dir: z.enum(["asc", "desc"]).optional(),
        section: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(({ data }) => listNotesImpl(data));
/* v8 ignore stop */

// New-note form: the sections to pick from + available tags.
export async function newNoteDataImpl(): Promise<{ sections: SectionOption[]; tags: Tag[] }> {
  const { getInterviewSections, getAllTags } = await import("@/db/queries");
  const [sections, tags] = await Promise.all([getInterviewSections(), getAllTags()]);
  return { sections: sections.map((s) => ({ id: s.id, label: s.label, slug: s.slug })), tags };
}

export const newNoteDataFn = createServerFn({ method: "GET" }).handler(newNoteDataImpl);

// Edit-note form: the note (with its tag ids resolved) + sections + tags.
export async function editNoteDataImpl(data: {
  id: string;
}): Promise<{ note: NoteDetail; sections: SectionOption[]; tags: Tag[] }> {
  const { getInterviewNoteById, getInterviewSections, getAllTags } = await import("@/db/queries");
  const [note, sectionRows, tags] = await Promise.all([
    getInterviewNoteById(data.id),
    getInterviewSections(),
    getAllTags(),
  ]);
  const sections = sectionRows.map((s) => ({ id: s.id, label: s.label, slug: s.slug }));
  if (!note) return { note: null, sections, tags };
  // The note's tags come back as { name, slug }; resolve them to tag ids
  // (unique slugs) for the tag combobox.
  const noteSlugs = new Set(note.tags.map((nt) => nt.slug));
  const tagIds = tags.filter((tag) => noteSlugs.has(tag.slug)).map((tag) => tag.id);
  return {
    note: {
      id: note.id,
      slug: note.slug,
      sectionId: note.sectionId,
      title: note.title,
      contentMd: note.contentMd,
      status: note.status as "draft" | "published",
      pinned: note.pinned === 1,
      publishedAt: note.publishedAt,
      tagIds,
    },
    sections,
    tags,
  };
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const editNoteDataFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(({ data }) => editNoteDataImpl(data));
/* v8 ignore stop */

// A link target the editor's link dialog can point at: internal URL plus the
// bits the result list renders (type badge, section, draft marker).
export type LinkTarget = {
  type: "post" | "note";
  title: string;
  url: string;
  status: string;
  // Badge context: "post" for posts, the section slug for notes.
  context: string;
};

// Title search across posts AND interview notes for the editor's link dialog.
// Drafts are included (the author may link ahead of publishing) and badged.
export async function searchLinkTargetsImpl(data: { q: string }): Promise<LinkTarget[]> {
  const { getAdminPosts, searchAdminInterviewNotes } = await import("@/db/queries");
  const [{ items: posts }, notes] = await Promise.all([
    getAdminPosts({ q: data.q, limit: 8 }),
    searchAdminInterviewNotes(data.q, 8),
  ]);
  return [
    ...posts.map<LinkTarget>((p) => ({
      type: "post",
      title: p.title,
      url: `/posts/${p.slug}`,
      status: p.status,
      context: "post",
    })),
    ...notes.map<LinkTarget>((n) => ({
      type: "note",
      title: n.title,
      url: `/interview/${n.sectionSlug}/${n.slug}`,
      status: n.status,
      context: n.sectionSlug,
    })),
  ];
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const searchLinkTargetsFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ q: z.string().min(1) }).parse(data))
  .handler(({ data }) => searchLinkTargetsImpl(data));
/* v8 ignore stop */

// Site settings key/value map for the settings form.
export async function getSettingsImpl(): Promise<Record<string, string>> {
  const { getSiteSettings } = await import("@/db/queries");
  return getSiteSettings();
}

export const getSettingsFn = createServerFn({ method: "GET" }).handler(getSettingsImpl);

// Pages admin list.
export async function listPagesImpl(): Promise<PageListItem[]> {
  const { getPagesList } = await import("@/db/queries");
  return getPagesList();
}

export const listPagesFn = createServerFn({ method: "GET" }).handler(listPagesImpl);

// Single page for the edit form (null when the slug doesn't exist).
export async function getPageImpl(data: { slug: string }): Promise<PageDetail> {
  const { getPageBySlug } = await import("@/db/queries");
  const page = await getPageBySlug(data.slug);
  return page
    ? { id: page.id, slug: page.slug, title: page.title, contentMd: page.contentMd }
    : null;
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const getPageFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(({ data }) => getPageImpl(data));
/* v8 ignore stop */

// New-post form: available tags + the OG brand line.
export async function newPostDataImpl(): Promise<{ tags: Tag[]; ogBrand: string }> {
  const { getAllTags, getSiteSettings } = await import("@/db/queries");
  const [tags, settings] = await Promise.all([getAllTags(), getSiteSettings()]);
  return { tags, ogBrand: computeOgBrand(settings) };
}

export const newPostDataFn = createServerFn({ method: "GET" }).handler(newPostDataImpl);

// Edit-post form: the post being edited (null when missing) + tags + OG brand.
export async function editPostDataImpl(data: {
  id: string;
}): Promise<{ post: AdminPostDetail | null; tags: Tag[]; ogBrand: string }> {
  const { getAdminPostById, getAllTags, getSiteSettings } = await import("@/db/queries");
  const [post, tags, settings] = await Promise.all([
    getAdminPostById(data.id),
    getAllTags(),
    getSiteSettings(),
  ]);
  return { post, tags, ogBrand: computeOgBrand(settings) };
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const editPostDataFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(({ data }) => editPostDataImpl(data));
/* v8 ignore stop */

// The admin works table searches / sorts / paginates client-side, so the loader
// takes the full list.
export async function listWorksImpl(): Promise<AdminWork[]> {
  const { getAllAdminWorks } = await import("@/db/queries");
  return getAllAdminWorks();
}

export const listWorksFn = createServerFn({ method: "GET" }).handler(listWorksImpl);

// New-work form: available tags + the OG brand line.
export async function newWorkDataImpl(): Promise<{ tags: Tag[]; ogBrand: string }> {
  const { getAllTags, getSiteSettings } = await import("@/db/queries");
  const [tags, settings] = await Promise.all([getAllTags(), getSiteSettings()]);
  return { tags, ogBrand: computeOgBrand(settings) };
}

export const newWorkDataFn = createServerFn({ method: "GET" }).handler(newWorkDataImpl);

// Edit-work form: the work being edited (null when missing) + tags + OG brand.
export async function editWorkDataImpl(data: {
  id: string;
}): Promise<{ work: AdminWorkDetail | null; tags: Tag[]; ogBrand: string }> {
  const { getAdminWorkById, getAllTags, getSiteSettings } = await import("@/db/queries");
  const [work, tags, settings] = await Promise.all([
    getAdminWorkById(data.id),
    getAllTags(),
    getSiteSettings(),
  ]);
  return { work, tags, ogBrand: computeOgBrand(settings) };
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const editWorkDataFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(({ data }) => editWorkDataImpl(data));
/* v8 ignore stop */
