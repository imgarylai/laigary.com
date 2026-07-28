import { useMemo } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { PushPinIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import { NoteRowActions } from "./NoteRowActions";
import { useI18n } from "@/i18n/I18nProvider";

type Note = {
  id: string;
  slug: string;
  title: string;
  status: string;
  pinned: boolean;
  sectionId: string;
  sectionLabel: string;
  sectionSlug: string;
};

const route = getRouteApi("/admin/interview/notes/");

export function NotesListClient({ notes }: { notes: Note[] }) {
  const { t } = useI18n();
  const { q, page } = route.useSearch();
  const navigate = route.useNavigate();

  const columns = useMemo<ColumnDef<Note, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("noteList.title"),
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            {row.original.pinned && (
              <PushPinIcon weight="fill" className="size-4 shrink-0 text-muted-foreground" />
            )}
            <Link
              to="/admin/interview/notes/$noteId/edit"
              params={{ noteId: row.original.id }}
              className="font-medium hover:underline"
            >
              {row.original.title}
            </Link>
          </span>
        ),
      },
      { accessorKey: "sectionLabel", header: t("noteList.section") },
      {
        accessorKey: "status",
        header: t("noteList.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { headClassName: "w-10", cellClassName: "w-10 text-right" },
        cell: ({ row }) => (
          <NoteRowActions
            noteId={row.original.id}
            noteSlug={row.original.slug}
            noteTitle={row.original.title}
            sectionSlug={row.original.sectionSlug}
            published={row.original.status === "published"}
          />
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
        <Button nativeButton={false} render={<Link to="/admin/interview/notes/new" />}>
          {t("noteList.newNote")}
        </Button>
      }
      emptyMessage={t("admin.noNotes")}
      onRowActivate={(note) =>
        navigate({ to: "/admin/interview/notes/$noteId/edit", params: { noteId: note.id } })
      }
      globalFilter={q ?? ""}
      onGlobalFilterChange={(v) =>
        navigate({ search: (prev) => ({ ...prev, q: v || undefined }), replace: true })
      }
      pageIndex={(page ?? 1) - 1}
      onPageChange={(idx) =>
        navigate({
          search: (prev) => ({ ...prev, page: idx === 0 ? undefined : idx + 1 }),
          replace: true,
        })
      }
    />
  );
}
