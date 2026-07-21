import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "./DataTable";
import { useI18n } from "@/i18n/I18nProvider";

type Page = {
  id: string;
  slug: string;
  title: string;
  updatedAt: number;
};

export function PagesListClient({ pages }: { pages: Page[] }) {
  const { t, locale } = useI18n();

  const columns = useMemo<ColumnDef<Page, unknown>[]>(() => {
    function formatDate(ts: number): string {
      return new Date(ts * 1000).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    return [
      {
        accessorKey: "title",
        header: t("pageList.title"),
        cell: ({ row }) => (
          <Link
            to="/admin/pages/$slug/edit"
            params={{ slug: row.original.slug }}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "slug",
        header: t("pageList.slug"),
        cell: ({ row }) => <span className="text-muted-foreground">/{row.original.slug}</span>,
      },
      {
        accessorKey: "updatedAt",
        header: t("pageList.updated"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
        ),
      },
      {
        id: "actions",
        header: t("pageList.actions"),
        enableSorting: false,
        meta: { headClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon-sm"
              render={
                <a
                  href={`/${row.original.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  title={t("pageList.view")}
                />
              }
            >
              <ArrowSquareOutIcon className="size-4" />
            </Button>
          </div>
        ),
      },
    ];
  }, [t, locale]);

  return (
    <DataTable
      columns={columns}
      data={pages}
      searchPlaceholder={t("pageList.searchPlaceholder")}
      toolbar={<Button render={<Link to="/admin/pages/new" />}>{t("pageList.newPage")}</Button>}
      emptyMessage={t("admin.noPages")}
    />
  );
}
