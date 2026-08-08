import { useMemo } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumnDef } from "./DataTable";
import { PageRowActions } from "./PageRowActions";
import { useI18n } from "@/i18n/I18nProvider";

type Page = {
  id: string;
  slug: string;
  title: string;
  updatedAt: number;
};

const route = getRouteApi("/admin/pages/");

export function PagesListClient({ pages }: { pages: Page[] }) {
  const { t, locale } = useI18n();
  const { q, page } = route.useSearch();
  const navigate = route.useNavigate();

  const columns = useMemo<DataTableColumnDef<Page>[]>(() => {
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
        header: "",
        enableSorting: false,
        meta: { headClassName: "w-10", cellClassName: "w-10 text-right" },
        cell: ({ row }) => (
          <PageRowActions pageSlug={row.original.slug} pageTitle={row.original.title} />
        ),
      },
    ];
  }, [t, locale]);

  return (
    <DataTable
      columns={columns}
      data={pages}
      searchPlaceholder={t("pageList.searchPlaceholder")}
      toolbar={
        <Button nativeButton={false} render={<Link to="/admin/pages/new" />}>
          {t("pageList.newPage")}
        </Button>
      }
      emptyMessage={t("admin.noPages")}
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
