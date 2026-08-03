import { createFileRoute } from "@tanstack/react-router";
import { dashboardStatsFn } from "@/server/admin/reads";
import { useI18n } from "@/i18n/I18nProvider";
import { adminPageTitle } from "@/components/admin/admin-location";
import { DashboardStats } from "@/components/admin/DashboardStats";

export const Route = createFileRoute("/admin/")({
  loader: () => dashboardStatsFn(),
  head: (ctx) => ({ meta: [{ title: adminPageTitle(ctx) }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  const stats = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("admin.dashboard")}</h1>
      <DashboardStats stats={stats} />
    </div>
  );
}
