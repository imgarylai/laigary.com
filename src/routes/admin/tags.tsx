import { createFileRoute } from "@tanstack/react-router";
import { listTagsFn } from "@/server/admin/reads";
import { parseListSearch } from "@/components/admin/list-search";
import { TagsListClient } from "@/components/admin/TagsListClient";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/tags")({
  validateSearch: parseListSearch,
  loader: () => listTagsFn(),
  component: TagsPage,
});

function TagsPage() {
  const { t } = useI18n();
  const tags = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.tags")}</h1>
      <TagsListClient tags={tags} />
    </div>
  );
}
