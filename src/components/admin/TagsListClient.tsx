import { useMemo } from "react";
import { getRouteApi } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { TagFormDialog } from "./TagFormDialog";
import { DeleteTagButton } from "./DeleteTagButton";
import { useI18n } from "@/i18n/I18nProvider";

type Tag = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  noteCount: number;
  usedBy: { type: "post" | "note"; title: string; slug: string }[];
};

const route = getRouteApi("/admin/tags");

export function TagsListClient({ tags }: { tags: Tag[] }) {
  const { t } = useI18n();
  const { q } = route.useSearch();
  const navigate = route.useNavigate();

  const columns = useMemo<ColumnDef<Tag, unknown>[]>(
    () => [
      { accessorKey: "name", header: t("tagList.name") },
      {
        accessorKey: "slug",
        header: t("tagList.slug"),
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.slug}</span>,
      },
      {
        id: "used",
        header: t("tagList.used"),
        accessorFn: (row) => row.postCount + row.noteCount,
        cell: ({ row }) => {
          const used = row.original.postCount + row.original.noteCount;
          return used > 0 ? <span>{used}</span> : <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "actions",
        header: t("tagList.actions"),
        enableSorting: false,
        meta: { headClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <TagFormDialog
              tag={{ id: row.original.id, name: row.original.name, slug: row.original.slug }}
            />
            <DeleteTagButton tag={row.original} />
          </div>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable
      columns={columns}
      data={tags}
      searchPlaceholder={t("tagList.searchPlaceholder")}
      toolbar={<TagFormDialog />}
      emptyMessage={t("admin.noTags")}
      globalFilter={q ?? ""}
      onGlobalFilterChange={(v) =>
        navigate({ search: (prev) => ({ ...prev, q: v || undefined }), replace: true })
      }
    />
  );
}
