import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/admin/interview")({
  component: () => <AdminPlaceholder titleKey="admin.interview" />,
});
