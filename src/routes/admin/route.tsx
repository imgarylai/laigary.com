import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Toaster } from "@/components/ui/sonner";

// The /admin layout. Theme + i18n providers are scoped to the admin tree (the
// public site gets its own theming system later), so AdminSidebar/AdminHeader
// can call useTheme()/useI18n(). Access protection for /admin lives at the edge
// (Cloudflare Access, provisioned in #9) — no in-app gate is needed here.
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
