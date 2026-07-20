import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/admin/tags")({
  component: () => <AdminPlaceholder titleKey="admin.tags" />,
});
