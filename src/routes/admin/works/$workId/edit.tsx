import { createFileRoute, notFound } from "@tanstack/react-router";
import { editWorkDataFn } from "@/server/admin/reads";
import { WorkForm } from "@/components/admin/WorkForm";
import { adminPageTitle } from "@/components/admin/admin-location";

export const Route = createFileRoute("/admin/works/$workId/edit")({
  loader: async ({ params }) => {
    const data = await editWorkDataFn({ data: { id: params.workId } });
    if (!data.work) throw notFound();
    return { work: data.work, tags: data.tags, ogBrand: data.ogBrand };
  },
  head: (ctx) => ({ meta: [{ title: adminPageTitle(ctx, ctx.loaderData?.work.title) }] }),
  component: EditWorkPage,
});

function EditWorkPage() {
  const { work, tags, ogBrand } = Route.useLoaderData();

  return (
    <div>
      <WorkForm work={work} availableTags={tags} ogBrand={ogBrand} />
    </div>
  );
}
