import { createFileRoute, notFound } from "@tanstack/react-router";
import { editNoteDataFn } from "@/server/admin/reads";
import { NoteForm } from "@/components/admin/NoteForm";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/admin/interview/notes/$noteId/edit")({
  loader: async ({ params }) => {
    const data = await editNoteDataFn({ data: { id: params.noteId } });
    if (!data.note) throw notFound();
    return { note: data.note, sections: data.sections, tags: data.tags };
  },
  component: EditNotePage,
});

function EditNotePage() {
  const { t } = useI18n();
  const { note, sections, tags } = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">{t("admin.editNote")}</h1>
      <NoteForm note={note} sections={sections} tags={tags} />
    </div>
  );
}
