import { createFileRoute } from "@tanstack/react-router";
import { listPostsFn } from "@/server/admin/reads";
import { parsePostsListSearch } from "./-list-search";
import { PostsListClient } from "@/components/admin/PostsListClient";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/posts/")({
  validateSearch: parsePostsListSearch,
  loader: () => listPostsFn(),
  component: PostsPage,
});

function PostsPage() {
  const { t } = useI18n();
  const posts = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.posts")}</h1>
      <PostsListClient posts={posts} />
    </div>
  );
}
