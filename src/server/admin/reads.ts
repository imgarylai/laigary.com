import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AdminPost, AdminPostDetail, Tag } from "@/db/queries";

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

const listPostsSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  page: z.number().int().min(1).optional(),
});

export const PAGE_SIZE = 20;

export const listPostsFn = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => listPostsSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ items: AdminPost[]; total: number; page: number; totalPages: number }> => {
      const { getAdminPosts } = await import("@/db/queries");
      const page = data.page ?? 1;
      const { items, total } = await getAdminPosts({
        q: data.q,
        status: data.status,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      return { items, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
    },
  );

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
