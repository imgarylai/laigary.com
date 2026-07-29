import { useMemo } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { PushPinIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import type { WorkStatus } from "@/routes/admin/works/-list-search";
import { WorkRowActions } from "./WorkRowActions";
import { useI18n } from "@/i18n/I18nProvider";
import { fmtRelativeFromUnix } from "@/lib/date";

type Work = {
  id: string;
  slug: string;
  title: string;
  status: string;
  pinned: boolean;
  year: number;
  updatedAt: number;
};

const route = getRouteApi("/admin/works/");

export function WorksListClient({ works }: { works: Work[] }) {
  const { t, locale } = useI18n();
  // Filters live in the URL (see -list-search.ts) so leaving the list and
  // coming back — or reloading — restores the filtered view.
  const { q, status, page } = route.useSearch();
  const navigate = route.useNavigate();

  // Memoized so the filtered array keeps a stable identity across renders —
  // otherwise react-table sees "new data" every render and resets the page.
  const data = useMemo(
    () => (status === undefined ? works : works.filter((w) => w.status === status)),
    [works, status],
  );

  const columns = useMemo<ColumnDef<Work, unknown>[]>(() => {
    function absoluteDate(ts: number): string {
      return new Date(ts * 1000).toLocaleString(locale, { dateStyle: "long", timeStyle: "short" });
    }

    return [
      {
        accessorKey: "title",
        header: t("workList.title"),
        // Title → edit (the primary click target for a row).
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            {row.original.pinned && (
              <PushPinIcon weight="fill" className="size-4 shrink-0 text-muted-foreground" />
            )}
            <Link
              to="/admin/works/$workId/edit"
              params={{ workId: row.original.id }}
              className="font-medium hover:underline"
            >
              {row.original.title}
            </Link>
          </span>
        ),
      },
      {
        accessorKey: "year",
        header: t("workList.year"),
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.year}</span>,
      },
      {
        accessorKey: "status",
        header: t("workList.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "updatedAt",
        header: t("workList.updated"),
        cell: ({ row }) => (
          // Relative, because in a working list almost everything is recent and
          // "3 hours ago" is the distinction being scanned for. The exact
          // timestamp stays one hover away.
          <span className="text-muted-foreground" title={absoluteDate(row.original.updatedAt)}>
            {fmtRelativeFromUnix(row.original.updatedAt, locale)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { headClassName: "w-10", cellClassName: "w-10 text-right" },
        cell: ({ row }) => (
          <WorkRowActions workId={row.original.id} workTitle={row.original.title} />
        ),
      },
    ];
  }, [t, locale]);

  const toolbar = (
    <>
      <Select
        value={status ?? "all"}
        onValueChange={(v) =>
          navigate({
            search: (prev) => ({ ...prev, status: v === "all" ? undefined : (v as WorkStatus) }),
            replace: true,
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("workList.all")}</SelectItem>
          <SelectItem value="draft">{t("postForm.draft")}</SelectItem>
          <SelectItem value="published">{t("postForm.published")}</SelectItem>
        </SelectContent>
      </Select>
      <Button nativeButton={false} render={<Link to="/admin/works/new" />}>
        {t("admin.newWork")}
      </Button>
    </>
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder={t("workList.searchPlaceholder")}
      toolbar={toolbar}
      emptyMessage={t("common.noWorksFound")}
      onRowActivate={(work) =>
        navigate({ to: "/admin/works/$workId/edit", params: { workId: work.id } })
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
