import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  AdminInterviewNote,
  AdminPost,
  AdminPostDetail,
  PageListItem,
  Tag,
  TagWithUsage,
} from "@/db/queries";

type PageDetail = { id: string; slug: string; title: string; contentMd: string } | null;

type SectionOption = { id: string; label: string };
type NoteDetail = {
  id: string;
  slug: string;
  sectionId: string;
  title: string;
  contentMd: string;
  status: "draft" | "published";
  tagIds: string[];
} | null;

// Read-side server functions the admin route loaders call. Reads must run on the
// server (D1 binding), so the query layer is loaded with a dynamic import INSIDE
// each handler — never a static top-level import. A static import would pin the
// query modules (and their `cloudflare:workers` binding access) into the client
// bundle, since createServerFn keeps the handler closure client-side.

// The OG preview footer shown in the cover-image picker. Kept in sync with the
// real SEO metadata by deriving it from site_settings instead of hardcoding.
function computeOgBrand(settings: Record<string, string>): string {
  const name = settings.site_name || "啟靈工程師";
  let host = "";
  try {
    host = settings.site_url ? new URL(settings.site_url).host : "";
  } catch {
    host = "";
  }
  return host ? `${name} | ${host}` : name;
}

// The admin posts table searches / sorts / paginates client-side, so the loader
// takes the full list.
export const listPostsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminPost[]> => {
    const { getAllAdminPosts } = await import("@/db/queries");
    return getAllAdminPosts();
  },
);

// Tags admin list — every tag with its usage counts + what uses it.
export const listTagsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<TagWithUsage[]> => {
    const { getTagsWithUsage } = await import("@/db/queries");
    return getTagsWithUsage();
  },
);

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
export const listSectionsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SectionRow[]> => {
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
  },
);

// Interview notes admin list (full set; the table paginates client-side).
export const listNotesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminInterviewNote[]> => {
    const { getAllAdminInterviewNotes } = await import("@/db/queries");
    return getAllAdminInterviewNotes();
  },
);

// New-note form: the sections to pick from + available tags.
export const newNoteDataFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ sections: SectionOption[]; tags: Tag[] }> => {
    const { getInterviewSections, getAllTags } = await import("@/db/queries");
    const [sections, tags] = await Promise.all([getInterviewSections(), getAllTags()]);
    return { sections: sections.map((s) => ({ id: s.id, label: s.label })), tags };
  },
);

// Edit-note form: the note (with its tag ids resolved) + sections + tags.
export const editNoteDataFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(
    async ({ data }): Promise<{ note: NoteDetail; sections: SectionOption[]; tags: Tag[] }> => {
      const { getInterviewNoteById, getInterviewSections, getAllTags } =
        await import("@/db/queries");
      const [note, sectionRows, tags] = await Promise.all([
        getInterviewNoteById(data.id),
        getInterviewSections(),
        getAllTags(),
      ]);
      const sections = sectionRows.map((s) => ({ id: s.id, label: s.label }));
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
          tagIds,
        },
        sections,
        tags,
      };
    },
  );

// Site settings key/value map for the settings form.
export const getSettingsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, string>> => {
    const { getSiteSettings } = await import("@/db/queries");
    return getSiteSettings();
  },
);

// Pages admin list.
export const listPagesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<PageListItem[]> => {
    const { getPagesList } = await import("@/db/queries");
    return getPagesList();
  },
);

// Single page for the edit form (null when the slug doesn't exist).
export const getPageFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<PageDetail> => {
    const { getPageBySlug } = await import("@/db/queries");
    const page = await getPageBySlug(data.slug);
    return page
      ? { id: page.id, slug: page.slug, title: page.title, contentMd: page.contentMd }
      : null;
  });

// New-post form: available tags + the OG brand line.
export const newPostDataFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ tags: Tag[]; ogBrand: string }> => {
    const { getAllTags, getSiteSettings } = await import("@/db/queries");
    const [tags, settings] = await Promise.all([getAllTags(), getSiteSettings()]);
    return { tags, ogBrand: computeOgBrand(settings) };
  },
);

// Edit-post form: the post being edited (null when missing) + tags + OG brand.
export const editPostDataFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(
    async ({ data }): Promise<{ post: AdminPostDetail | null; tags: Tag[]; ogBrand: string }> => {
      const { getAdminPostById, getAllTags, getSiteSettings } = await import("@/db/queries");
      const [post, tags, settings] = await Promise.all([
        getAdminPostById(data.id),
        getAllTags(),
        getSiteSettings(),
      ]);
      return { post, tags, ogBrand: computeOgBrand(settings) };
    },
  );
