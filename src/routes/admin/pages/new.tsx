import { createFileRoute } from "@tanstack/react-router";
import { PageForm } from "@/components/admin/PageForm";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/pages/new")({
  component: NewPagePage,
});

function NewPagePage() {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">{t("admin.newPage")}</h1>
      <PageForm />
    </div>
  );
}
