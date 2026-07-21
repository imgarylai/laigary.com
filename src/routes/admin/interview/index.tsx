import { createFileRoute } from "@tanstack/react-router";
import { listSectionsFn, listNotesFn } from "@/server/admin/reads";
import { parseListSearch } from "@/components/admin/list-search";
import { SectionsListClient } from "@/components/admin/SectionsListClient";
import { NotesListClient } from "@/components/admin/NotesListClient";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/interview/")({
  // `q` drives the notes table (the big list); the sections table keeps its
  // local search — three rows don't need URL persistence.
  validateSearch: parseListSearch,
  loader: async () => {
    const [sections, notes] = await Promise.all([listSectionsFn(), listNotesFn()]);
    return { sections, notes };
  },
  component: InterviewPage,
});

function InterviewPage() {
  const { t } = useI18n();
  const { sections, notes } = Route.useLoaderData();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.interview")}</h1>
        <h2 className="mb-3 text-lg font-semibold">{t("admin.interviewNotes")}</h2>
        <NotesListClient notes={notes} />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("admin.interviewSections")}</h2>
        <SectionsListClient sections={sections} />
      </section>
    </div>
  );
}
