import { createFileRoute, notFound } from "@tanstack/react-router";
import { editWorkDataFn } from "@/server/admin/reads";
import { WorkForm } from "@/components/admin/WorkForm";

export const Route = createFileRoute("/admin/works/$workId/edit")({
  loader: async ({ params }) => {
    const data = await editWorkDataFn({ data: { id: params.workId } });
    if (!data.work) throw notFound();
    return { work: data.work, tags: data.tags, ogBrand: data.ogBrand };
  },
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
