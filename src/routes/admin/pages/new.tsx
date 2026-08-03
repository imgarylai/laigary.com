import { createFileRoute } from "@tanstack/react-router";
import { PageForm } from "@/components/admin/PageForm";
import { adminPageTitle } from "@/components/admin/admin-location";

export const Route = createFileRoute("/admin/pages/new")({
  head: (ctx) => ({ meta: [{ title: adminPageTitle(ctx) }] }),
  component: NewPagePage,
});

function NewPagePage() {
  return (
    <div>
      <PageForm />
    </div>
  );
}
