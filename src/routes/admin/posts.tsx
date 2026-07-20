import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/admin/posts")({
  component: () => <AdminPlaceholder titleKey="admin.posts" />,
});
