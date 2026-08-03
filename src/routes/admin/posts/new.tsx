import { createFileRoute } from "@tanstack/react-router";
import { newPostDataFn } from "@/server/admin/reads";
import { PostForm } from "@/components/admin/PostForm";
import { adminPageTitle } from "@/components/admin/admin-location";

export const Route = createFileRoute("/admin/posts/new")({
  loader: () => newPostDataFn(),
  head: (ctx) => ({ meta: [{ title: adminPageTitle(ctx) }] }),
  component: NewPostPage,
});

function NewPostPage() {
  const { tags, ogBrand } = Route.useLoaderData();

  return (
    <div>
      <PostForm availableTags={tags} ogBrand={ogBrand} />
    </div>
  );
}
