import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPageFn } from "@/server/admin/reads";
import { PageForm } from "@/components/admin/PageForm";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/pages/$slug/edit")({
  loader: async ({ params }) => {
    const page = await getPageFn({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return page;
  },
  component: EditPagePage,
});

function EditPagePage() {
  const { t } = useI18n();
  const page = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">{t("admin.editPage")}</h1>
      <PageForm page={{ slug: page.slug, title: page.title, contentMd: page.contentMd }} />
    </div>
  );
}
