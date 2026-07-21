import { createFileRoute } from "@tanstack/react-router";
import { listPostsFn } from "@/server/admin/reads";
import { PostsListClient } from "@/components/admin/PostsListClient";
import { AdminPagination } from "@/components/admin/Pagination";
import { useI18n } from "@/i18n/I18nProvider";

type PostsSearch = {
  q?: string;
  status?: "draft" | "published";
  page?: number;
};

export const Route = createFileRoute("/admin/posts/")({
  validateSearch: (search: Record<string, unknown>): PostsSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    status: search.status === "draft" || search.status === "published" ? search.status : undefined,
    page: search.page ? Number(search.page) || undefined : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q, status: search.status, page: search.page }),
  loader: ({ deps }) => listPostsFn({ data: deps }),
  component: PostsPage,
});

function PostsPage() {
  const { t } = useI18n();
  const { items, page, totalPages } = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.posts")}</h1>
      <PostsListClient posts={items} q={search.q ?? ""} status={search.status ?? "all"} />
      <AdminPagination page={page} totalPages={totalPages} q={search.q} status={search.status} />
    </div>
  );
}
