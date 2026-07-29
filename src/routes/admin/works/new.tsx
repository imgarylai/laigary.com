import { createFileRoute } from "@tanstack/react-router";
import { newWorkDataFn } from "@/server/admin/reads";
import { WorkForm } from "@/components/admin/WorkForm";

export const Route = createFileRoute("/admin/works/new")({
  loader: () => newWorkDataFn(),
  component: NewWorkPage,
});

function NewWorkPage() {
  const { tags, ogBrand } = Route.useLoaderData();

  return (
    <div>
      <WorkForm availableTags={tags} ogBrand={ogBrand} />
    </div>
  );
}
