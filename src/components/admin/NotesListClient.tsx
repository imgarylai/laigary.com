import { useMemo } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowSquareOutIcon, PushPinIcon } from "@phosphor-icons/react";
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
            {/* View the live page in a new tab; drafts have no public page. */}
            {row.original.status === "published" && (
              <Button
                variant="ghost"
                size="icon-sm"
                render={
                  <Link
                    to="/interview/$section/$slug"
                    params={{ section: row.original.sectionSlug, slug: row.original.slug }}
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
