import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPageFn } from "@/server/admin/reads";
import { PageForm } from "@/components/admin/PageForm";

export const Route = createFileRoute("/admin/pages/$slug/edit")({
  loader: async ({ params }) => {
    const page = await getPageFn({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return page;
  },
  component: EditPagePage,
});

function EditPagePage() {
  const page = Route.useLoaderData();

  return (
    <div>
      <PageForm page={{ slug: page.slug, title: page.title, contentMd: page.contentMd }} />
    </div>
  );
}
