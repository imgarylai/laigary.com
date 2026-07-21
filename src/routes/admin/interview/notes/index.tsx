import { createFileRoute } from "@tanstack/react-router";
import { listNotesFn } from "@/server/admin/reads";
import { parseListSearch } from "@/components/admin/list-search";
import { NotesListClient } from "@/components/admin/NotesListClient";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/interview/notes/")({
  validateSearch: parseListSearch,
  loader: () => listNotesFn(),
  component: NotesPage,
});

function NotesPage() {
  const { t } = useI18n();
  const notes = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.interviewNotes")}</h1>
      <NotesListClient notes={notes} />
    </div>
  );
}
