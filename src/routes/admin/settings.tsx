import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/admin/settings")({
  component: () => <AdminPlaceholder titleKey="admin.settings" />,
});
