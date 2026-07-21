import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AdminPost, AdminPostDetail, PageListItem, Tag, TagWithUsage } from "@/db/queries";

type PageDetail = { id: string; slug: string; title: string; contentMd: string } | null;

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
