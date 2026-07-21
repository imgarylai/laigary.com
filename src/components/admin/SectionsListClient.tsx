import { useMemo } from "react";
import { getRouteApi } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { SectionFormDialog } from "./SectionFormDialog";
import { DeleteSectionButton } from "./DeleteSectionButton";
import { useI18n } from "@/i18n/I18nProvider";

type Section = {
  id: string;
  slug: string;
  label: string;
  blurb: string;
  icon: string;
  sortOrder: number;
  noteCount: number;
};

const route = getRouteApi("/admin/interview/sections");

export function SectionsListClient({ sections }: { sections: Section[] }) {
  const { t } = useI18n();
  const { q } = route.useSearch();
  const navigate = route.useNavigate();

  const columns = useMemo<ColumnDef<Section, unknown>[]>(
    () => [
      { accessorKey: "label", header: t("sectionList.label") },
      {
        accessorKey: "slug",
        header: t("sectionList.slug"),
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.slug}</span>,
      },
      { accessorKey: "sortOrder", header: t("sectionList.sortOrder") },
      {
        accessorKey: "noteCount",
        header: t("sectionList.notes"),
        cell: ({ row }) =>
          row.original.noteCount > 0 ? (
            <span>{row.original.noteCount}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: t("sectionList.actions"),
        enableSorting: false,
        meta: { headClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <SectionFormDialog section={row.original} />
            <DeleteSectionButton section={row.original} />
          </div>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable
      columns={columns}
      data={sections}
      searchPlaceholder={t("sectionList.searchPlaceholder")}
      toolbar={<SectionFormDialog />}
      emptyMessage={t("admin.noSections")}
      globalFilter={q ?? ""}
      onGlobalFilterChange={(v) =>
        navigate({ search: (prev) => ({ ...prev, q: v || undefined }), replace: true })
      }
    />
  );
}
