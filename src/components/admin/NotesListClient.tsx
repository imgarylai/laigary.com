import { useMemo } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "./DataTable";
import { DeleteNoteButton } from "./DeleteNoteButton";
import { useI18n } from "@/i18n/I18nProvider";

type Note = {
  id: string;
  slug: string;
  title: string;
  status: string;
  sectionId: string;
  sectionLabel: string;
  sectionSlug: string;
};

const route = getRouteApi("/admin/interview/notes/");

export function NotesListClient({ notes }: { notes: Note[] }) {
  const { t } = useI18n();
  const { q } = route.useSearch();
  const navigate = route.useNavigate();

  const columns = useMemo<ColumnDef<Note, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("noteList.title"),
        cell: ({ row }) => (
          <Link
            to="/admin/interview/notes/$noteId/edit"
            params={{ noteId: row.original.id }}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      { accessorKey: "sectionLabel", header: t("noteList.section") },
      {
        accessorKey: "status",
        header: t("noteList.status"),
        cell: ({ row }) => (
          <Badge variant={row.original.status === "published" ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: t("noteList.actions"),
        enableSorting: false,
        meta: { headClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {/* View the live page — plain anchor since the public interview
                route lands in the frontend phase; drafts have no public page. */}
            {row.original.status === "published" && (
              <Button
                variant="ghost"
                size="icon-sm"
                render={
                  <a
                    href={`/interview/${row.original.sectionSlug}/${row.original.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    title={t("noteList.view")}
                  />
                }
              >
                <ArrowSquareOutIcon className="size-4" />
              </Button>
            )}
            <DeleteNoteButton noteId={row.original.id} noteTitle={row.original.title} />
          </div>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable
      columns={columns}
      data={notes}
      searchPlaceholder={t("noteList.searchPlaceholder")}
      toolbar={
        <Button render={<Link to="/admin/interview/notes/new" />}>{t("noteList.newNote")}</Button>
      }
      emptyMessage={t("admin.noNotes")}
      globalFilter={q ?? ""}
      onGlobalFilterChange={(v) =>
        navigate({ search: (prev) => ({ ...prev, q: v || undefined }), replace: true })
      }
    />
  );
}
