import { createFileRoute } from "@tanstack/react-router";
import { PageForm } from "@/components/admin/PageForm";

export const Route = createFileRoute("/admin/pages/new")({
  component: NewPagePage,
});

function NewPagePage() {
  return (
    <div>
      <PageForm />
    </div>
  );
}
