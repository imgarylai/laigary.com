import { createFileRoute, notFound } from "@tanstack/react-router";
import { editNoteDataFn } from "@/server/admin/reads";
import { NoteForm } from "@/components/admin/NoteForm";

export const Route = createFileRoute("/admin/interview/notes/$noteId/edit")({
  loader: async ({ params }) => {
    const data = await editNoteDataFn({ data: { id: params.noteId } });
    if (!data.note) throw notFound();
    return { note: data.note, sections: data.sections, tags: data.tags };
  },
  component: EditNotePage,
});

function EditNotePage() {
  const { note, sections, tags } = Route.useLoaderData();

  return (
    <div>
      <NoteForm note={note} sections={sections} tags={tags} />
    </div>
  );
}
