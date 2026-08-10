import { useMemo } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { PushPinIcon } from "@phosphor-icons/react";
import type { SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NoteStatus } from "@/routes/admin/interview/notes/-list-search";
import { DataTable, type DataTableColumnDef } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import { NoteRowActions } from "./NoteRowActions";
import { useI18n } from "@/i18n/I18nProvider";
import { PublishDateCell } from "./PublishDateCell";

type Note = {
  id: string;
  slug: string;
  title: string;
  status: string;
  pinned: boolean;
  publishedAt: number | null;
  sectionId: string;
  sectionLabel: string;
  sectionSlug: string;
};

const route = getRouteApi("/admin/interview/notes/");

// How long typing has to pause before the search reaches the URL. Every change
// to the URL re-runs the loader against D1, so this is the difference between
// one query per search and one per keystroke.
const SEARCH_DEBOUNCE_MS = 300;

// "No filter" needs a value of its own for the dropdown, but stays out of the
// URL — `?section=all` would be a filter the loader then has to resolve.
const ALL = "all";

type SectionOption = { id: string; label: string; slug: string };

export function NotesListClient({
  notes,
  total,
  pageSize,
  sections,
}: {
  notes: Note[];
  total: number;
  pageSize: number;
  sections: SectionOption[];
}) {
  const { t } = useI18n();
  const { q, page, sort, dir, section, status } = route.useSearch();
  const navigate = route.useNavigate();

  // Both filters narrow the result set the same way a search does, so both
  // reset the page — page 4 of the old set is not page 4 of the new one.
  function setFilter(next: { section?: string; status?: NoteStatus }) {
    navigate({ search: (prev) => ({ ...prev, ...next, page: undefined }), replace: true });
  }

  // A `?section=` slug the loader could not resolve shows as "all", which is
  // the list it is actually looking at.
  const sectionValue = sections.some((s) => s.slug === section) ? (section as string) : ALL;

  const sectionOptions = useMemo(
    () => [
      { value: ALL, label: t("noteList.allSections") },
      ...sections.map((s) => ({ value: s.slug, label: s.label })),
    ],
    [sections, t],
  );

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: t("noteList.allStatuses") },
      { value: "draft", label: t("postForm.draft") },
      { value: "published", label: t("postForm.published") },
    ],
    [t],
  );

  // No `?sort=` means the server's default, newest published first — and that
  // IS one of the table's columns now, so the header carries its arrow rather
  // than leaving the table looking unsorted while it is not.
  const sorting = useMemo<SortingState>(
    () => [{ id: sort ?? "publishedAt", desc: dir !== "asc" }],
    [sort, dir],
  );

  const columns = useMemo<DataTableColumnDef<Note>[]>(
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
        // Mirrors the post list: the column the table is ordered by is the one
        // it shows.
        accessorKey: "publishedAt",
        header: t("noteList.published"),
        cell: ({ row }) => <PublishDateCell publishedAt={row.original.publishedAt} />,
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
        <>
          {/* `items` as well as the rendered options: Base UI resolves the
              trigger's label from the popup, which is not mounted until it
              opens, so without it a closed filter reads "system-design". */}
          <Select
            value={sectionValue}
            items={sectionOptions}
            onValueChange={(v) =>
              setFilter({ section: typeof v === "string" && v !== ALL ? v : undefined })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sectionOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status ?? ALL}
            items={statusOptions}
            onValueChange={(v) => setFilter({ status: v === ALL ? undefined : (v as NoteStatus) })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button nativeButton={false} render={<Link to="/admin/interview/notes/new" />}>
            {t("noteList.newNote")}
          </Button>
        </>
      }
      emptyMessage={t("admin.noNotes")}
      onRowActivate={(note) =>
        navigate({ to: "/admin/interview/notes/$noteId/edit", params: { noteId: note.id } })
      }
      rowCount={total}
      pageSize={pageSize}
      globalFilter={q ?? ""}
      filterDebounceMs={SEARCH_DEBOUNCE_MS}
      // Searching and re-sorting both rebuild the result set, so page 4 of the
      // old one means nothing — drop back to the first page with the new query.
      onGlobalFilterChange={(v) =>
        navigate({
          search: (prev) => ({ ...prev, q: v || undefined, page: undefined }),
          replace: true,
        })
      }
      sorting={sorting}
      onSortingChange={(next) =>
        navigate({
          search: (prev) => ({
            ...prev,
            sort: next[0]?.id,
            dir: next[0] ? (next[0].desc ? "desc" : "asc") : undefined,
            page: undefined,
          }),
          replace: true,
        })
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
