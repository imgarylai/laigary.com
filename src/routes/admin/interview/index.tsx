import { createFileRoute } from "@tanstack/react-router";
import { listSectionsFn } from "@/server/admin/reads";
import { SectionsListClient } from "@/components/admin/SectionsListClient";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/interview/")({
  loader: () => listSectionsFn(),
  component: InterviewPage,
});

function InterviewPage() {
  const { t } = useI18n();
  const sections = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.interviewSections")}</h1>
      <SectionsListClient sections={sections} />
    </div>
  );
}
