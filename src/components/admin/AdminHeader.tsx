import { useMatches } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/admin/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import { breadcrumbKeyFor } from "./admin-location";

export function AdminHeader() {
  const { t } = useI18n();
  // The leaf match's `fullPath` is the route *pattern*, not the URL, so the
  // label is looked up by route identity rather than by string-matching the
  // pathname — which is exactly how this went blank on the editor routes (#178).
  const fullPath = useMatches({ select: (matches) => matches.at(-1)?.fullPath });
  const key = breadcrumbKeyFor(fullPath);

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm font-medium">{key ? t(key) : ""}</span>
      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
