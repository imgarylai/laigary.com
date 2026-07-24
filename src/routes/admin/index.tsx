import { createFileRoute } from "@tanstack/react-router";
import { dashboardStatsFn } from "@/server/admin/reads";
import { useI18n } from "@/i18n/I18nProvider";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
  loader: () => dashboardStatsFn(),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  const s = Route.useLoaderData();

  // ponytail: content counts off existing data. Traffic metrics (views) would
  // need a separate write path — not added yet.
  const stats: { label: string; value: number }[] = [
    { label: t("admin.published"), value: s.postsPublished },
    { label: t("admin.drafts"), value: s.postsDrafts },
    { label: t("admin.totalPosts"), value: s.postsTotal },
    { label: t("admin.notes"), value: s.notes },
    { label: t("admin.pages"), value: s.pages },
    { label: t("admin.tags"), value: s.tags },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("admin.dashboard")}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="text-3xl font-bold tabular-nums">{stat.value}</div>
            <div className="text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
