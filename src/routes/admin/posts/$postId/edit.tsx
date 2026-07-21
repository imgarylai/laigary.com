import { createFileRoute, notFound } from "@tanstack/react-router";
import { editPostDataFn } from "@/server/admin/reads";
import { PostForm } from "@/components/admin/PostForm";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/posts/$postId/edit")({
  loader: async ({ params }) => {
    const data = await editPostDataFn({ data: { id: params.postId } });
    if (!data.post) throw notFound();
    return { post: data.post, tags: data.tags, ogBrand: data.ogBrand };
  },
  component: EditPostPage,
});

function EditPostPage() {
  const { t } = useI18n();
  const { post, tags, ogBrand } = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">{t("admin.editPost")}</h1>
      <PostForm
        postId={post.id}
        availableTags={tags}
        ogBrand={ogBrand}
        initialData={{
          title: post.title,
          slug: post.slug,
          contentMd: post.contentMd,
          excerpt: post.excerpt ?? "",
          coverImageUrl: post.coverImageUrl ?? "",
          tagIds: post.tagIds,
          status: post.status,
        }}
      />
    </div>
  );
}
