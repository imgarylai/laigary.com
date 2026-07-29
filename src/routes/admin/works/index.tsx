import { createFileRoute } from "@tanstack/react-router";
import { listWorksFn } from "@/server/admin/reads";
import { parseWorksListSearch } from "./-list-search";
import { WorksListClient } from "@/components/admin/WorksListClient";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/works/")({
  validateSearch: parseWorksListSearch,
  loader: () => listWorksFn(),
  component: WorksPage,
});

function WorksPage() {
  const { t } = useI18n();
  const works = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.works")}</h1>
      <WorksListClient works={works} />
    </div>
  );
}
