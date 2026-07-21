import { createFileRoute } from "@tanstack/react-router";
import { listPagesFn } from "@/server/admin/reads";
import { PagesListClient } from "@/components/admin/PagesListClient";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/pages/")({
  loader: () => listPagesFn(),
  component: PagesPage,
});

function PagesPage() {
  const { t } = useI18n();
  const pages = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.pages")}</h1>
      <PagesListClient pages={pages} />
    </div>
  );
}
