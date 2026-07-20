import { Link, useLocation } from "@tanstack/react-router";
import {
  HouseIcon,
  ArticleIcon,
  TagIcon,
  FileTextIcon,
  ChatsIcon,
  GearIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useI18n } from "@/i18n/I18nProvider";

export function AdminSidebar() {
  const { pathname } = useLocation();
  const { t } = useI18n();

  // Flat nav. The Interview nested sub-nav (sections / notes) lands with its
  // pages in #30; here it is a single entry so the shell stays navigable.
  const navItems = [
    { title: t("admin.dashboard"), href: "/admin", icon: HouseIcon },
    { title: t("admin.posts"), href: "/admin/posts", icon: ArticleIcon },
    { title: t("admin.tags"), href: "/admin/tags", icon: TagIcon },
    { title: t("admin.pages"), href: "/admin/pages", icon: FileTextIcon },
    { title: t("admin.interview"), href: "/admin/interview", icon: ChatsIcon },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-2">
          <h2 className="text-lg font-bold tracking-tight">{t("common.siteName")}</h2>
          <p className="text-xs text-muted-foreground">{t("admin.admin")}</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("admin.menu")}</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  render={<Link to={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/admin/settings"}
              render={<Link to="/admin/settings" />}
            >
              <GearIcon />
              <span>{t("admin.settings")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/" />}>
              <ArrowLeftIcon />
              <span>{t("common.backToBlog")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
