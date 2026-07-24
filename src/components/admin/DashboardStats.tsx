import type { DashboardStats as Stats } from "@/db/queries";
import { useI18n } from "@/i18n/I18nProvider";
import { Card } from "@/components/ui/card";

// Content-count cards for the admin dashboard. Presentational: counts are
// computed server-side (getDashboardStats). No traffic/view metrics here.
export function DashboardStats({ stats }: { stats: Stats }) {
  const { t } = useI18n();
  const cards: { label: string; value: number }[] = [
    { label: t("admin.published"), value: stats.postsPublished },
    { label: t("admin.drafts"), value: stats.postsDrafts },
    { label: t("admin.totalPosts"), value: stats.postsTotal },
    { label: t("admin.notes"), value: stats.notes },
    { label: t("admin.pages"), value: stats.pages },
    { label: t("admin.tags"), value: stats.tags },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <div className="text-3xl font-bold tabular-nums">{card.value}</div>
          <div className="text-muted-foreground">{card.label}</div>
        </Card>
      ))}
    </div>
  );
}
