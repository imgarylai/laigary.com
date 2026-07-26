import { createFileRoute } from "@tanstack/react-router";
import { newPostDataFn } from "@/server/admin/reads";
import { PostForm } from "@/components/admin/PostForm";

export const Route = createFileRoute("/admin/posts/new")({
  loader: () => newPostDataFn(),
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
