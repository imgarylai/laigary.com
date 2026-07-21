import { useLocation } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/admin/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";

export function AdminHeader() {
  const { pathname } = useLocation();
  const { t } = useI18n();

  const breadcrumbMap: Record<string, string> = {
    "/admin": t("admin.dashboard"),
    "/admin/posts": t("admin.posts"),
    "/admin/new": t("admin.newPost"),
    "/admin/pages": t("admin.pages"),
    "/admin/tags": t("admin.tags"),
    "/admin/settings": t("admin.settings"),
    "/admin/interview": t("admin.interview"),
    "/admin/interview/notes": t("admin.interviewNotes"),
    "/admin/interview/sections": t("admin.interviewSections"),
  };

  let breadcrumb = breadcrumbMap[pathname] ?? "";
  if (pathname.startsWith("/admin/edit/")) {
    breadcrumb = t("admin.editPost");
  } else if (pathname.startsWith("/admin/pages/")) {
    breadcrumb = t("admin.editPage");
  } else if (!breadcrumb && pathname.startsWith("/admin/interview/notes/")) {
    breadcrumb = t("admin.editNote");
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm font-medium">{breadcrumb}</span>
      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
