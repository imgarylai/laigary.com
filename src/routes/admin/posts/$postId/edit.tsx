import { createFileRoute, notFound } from "@tanstack/react-router";
import { editPostDataFn } from "@/server/admin/reads";
import { PostForm } from "@/components/admin/PostForm";
import { adminPageTitle } from "@/components/admin/admin-location";

export const Route = createFileRoute("/admin/posts/$postId/edit")({
  loader: async ({ params }) => {
    const data = await editPostDataFn({ data: { id: params.postId } });
    if (!data.post) throw notFound();
    return { post: data.post, tags: data.tags, ogBrand: data.ogBrand };
  },
  // The post's own title leads the tab — a dozen open editors are otherwise
  // indistinguishable, which is the whole reason this route names itself.
  head: (ctx) => ({ meta: [{ title: adminPageTitle(ctx, ctx.loaderData?.post.title) }] }),
  component: EditPostPage,
});

function EditPostPage() {
  const { post, tags, ogBrand } = Route.useLoaderData();

  return (
    <div>
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
          pinned: post.pinned,
          publishedAt: post.publishedAt,
        }}
      />
    </div>
  );
}
