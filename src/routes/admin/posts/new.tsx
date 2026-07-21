import { createFileRoute } from "@tanstack/react-router";
import { newPostDataFn } from "@/server/admin/reads";
import { PostForm } from "@/components/admin/PostForm";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/posts/new")({
  loader: () => newPostDataFn(),
  component: NewPostPage,
});

function NewPostPage() {
  const { t } = useI18n();
  const { tags, ogBrand } = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">{t("admin.newPost")}</h1>
      <PostForm availableTags={tags} ogBrand={ogBrand} />
    </div>
  );
}
