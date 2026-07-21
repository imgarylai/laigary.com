import { createFileRoute, Outlet } from "@tanstack/react-router";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Toaster } from "@/components/ui/sonner";

// The /admin layout. The theme provider now lives at the root (it drives both
// the admin `.dark` class and the terminal `data-theme`), so this layout only
// scopes the i18n provider. Access protection for /admin lives at the edge
// (Cloudflare Access, provisioned in #9) — no in-app gate is needed here.
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <I18nProvider>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AdminHeader />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </I18nProvider>
  );
}
