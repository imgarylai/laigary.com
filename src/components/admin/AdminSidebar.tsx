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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { useI18n } from "@/i18n/I18nProvider";

export function AdminSidebar() {
  const { pathname } = useLocation();
  const { t } = useI18n();

  const navItems = [
    { title: t("admin.dashboard"), href: "/admin", icon: HouseIcon },
    { title: t("admin.posts"), href: "/admin/posts", icon: ArticleIcon },
    { title: t("admin.tags"), href: "/admin/tags", icon: TagIcon },
    { title: t("admin.pages"), href: "/admin/pages", icon: FileTextIcon },
  ];

  // Interview has two pages (#53): sections and notes. The parent entry links
  // to /admin/interview which redirects to the notes list.
  const interviewSubItems = [
    { title: t("admin.interviewSections"), href: "/admin/interview/sections" },
    { title: t("admin.interviewNotes"), href: "/admin/interview/notes" },
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
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/admin/interview")}
                render={<Link to="/admin/interview" />}
              >
                <ChatsIcon />
                <span>{t("admin.interview")}</span>
              </SidebarMenuButton>
              <SidebarMenuSub>
                {interviewSubItems.map((item) => (
                  <SidebarMenuSubItem key={item.href}>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith(item.href)}
                      render={<Link to={item.href} />}
                    >
                      <span>{item.title}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
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
