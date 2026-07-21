import { createFileRoute } from "@tanstack/react-router";
import { newNoteDataFn } from "@/server/admin/reads";
import { NoteForm } from "@/components/admin/NoteForm";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/interview/notes/new")({
  loader: () => newNoteDataFn(),
  component: NewNotePage,
});

function NewNotePage() {
  const { t } = useI18n();
  const { sections, tags } = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">{t("admin.newNote")}</h1>
      <NoteForm sections={sections} tags={tags} />
    </div>
  );
}
