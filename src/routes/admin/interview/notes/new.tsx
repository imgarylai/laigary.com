import { createFileRoute } from "@tanstack/react-router";
import { newNoteDataFn } from "@/server/admin/reads";
import { NoteForm } from "@/components/admin/NoteForm";
import { adminPageTitle } from "@/components/admin/admin-location";

export const Route = createFileRoute("/admin/interview/notes/new")({
  loader: () => newNoteDataFn(),
  head: (ctx) => ({ meta: [{ title: adminPageTitle(ctx) }] }),
  component: NewNotePage,
});

function NewNotePage() {
  const { sections, tags } = Route.useLoaderData();

  return (
    <div>
      <NoteForm sections={sections} tags={tags} />
    </div>
  );
}
