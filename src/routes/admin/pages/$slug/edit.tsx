import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPageFn } from "@/server/admin/reads";
import { PageForm } from "@/components/admin/PageForm";
import { adminPageTitle } from "@/components/admin/admin-location";

export const Route = createFileRoute("/admin/pages/$slug/edit")({
  loader: async ({ params }) => {
    const page = await getPageFn({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return page;
  },
  head: (ctx) => ({ meta: [{ title: adminPageTitle(ctx, ctx.loaderData?.title) }] }),
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
