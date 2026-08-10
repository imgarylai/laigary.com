import { createFileRoute } from "@tanstack/react-router";
import { listNotesFn } from "@/server/admin/reads";
import { parseNotesListSearch } from "./-list-search";
import { NotesListClient } from "@/components/admin/NotesListClient";
import { useI18n } from "@/i18n/I18nProvider";
import { adminPageTitle } from "@/components/admin/admin-location";

export const Route = createFileRoute("/admin/interview/notes/")({
  validateSearch: parseNotesListSearch,
  // The search params ARE the query: the server returns one filtered, sorted
  // page rather than the whole table, so the loader has to re-run when they
  // change — and, just as importantly, must not when anything else does.
  loaderDeps: ({ search }) => ({
    q: search.q,
    page: search.page,
    sort: search.sort,
    dir: search.dir,
    section: search.section,
    status: search.status,
  }),
  loader: ({ deps }) => listNotesFn({ data: deps }),
  head: (ctx) => ({ meta: [{ title: adminPageTitle(ctx) }] }),
  component: NotesPage,
});

function NotesPage() {
  const { t } = useI18n();
  const { items, total, pageSize, sections } = Route.useLoaderData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("admin.interviewNotes")}</h1>
      <NotesListClient notes={items} total={total} pageSize={pageSize} sections={sections} />
    </div>
  );
}
