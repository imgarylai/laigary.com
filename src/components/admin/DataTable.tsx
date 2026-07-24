import { useEffect, useState } from "react";
import {
  type ColumnDef,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

// Per-column tailwind hooks used by the header/cell renderers below.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headClassName?: string;
    cellClassName?: string;
  }
}
import {
  CaretUpIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/i18n/I18nProvider";

// Shared admin list table (posts / notes / tags). Data is loaded in full and
// searched / sorted / paginated client-side — fine at this blog's scale and it
// keeps every list snappy with no per-interaction round-trip. Each list just
// supplies its column defs and optional toolbar filters.
export function DataTable<T>({
  columns,
  data,
  searchPlaceholder,
  toolbar,
  pageSize = 20,
  emptyMessage,
  globalFilter: controlledFilter,
  onGlobalFilterChange,
  pageIndex: controlledPageIndex,
  onPageChange,
}: {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
  /** Controlled search text — pass together with onGlobalFilterChange to hold
      the filter outside the table (e.g. in the route's search params). */
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  /** Controlled 0-based page index — pass together with onPageChange to hold
      the current page outside the table (e.g. in the route's search params) so
      a reload restores it. Omit both to let the table page internally. */
  pageIndex?: number;
  onPageChange?: (index: number) => void;
}) {
  const { t } = useI18n();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalFilter, setInternalFilter] = useState("");
  const globalFilter = controlledFilter ?? internalFilter;
  const setGlobalFilter = onGlobalFilterChange ?? setInternalFilter;

  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const pageIndex = controlledPageIndex ?? internalPageIndex;
  const setPageIndex = onPageChange ?? setInternalPageIndex;

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === "function" ? updater(globalFilter) : updater;
      setGlobalFilter(typeof next === "string" ? next : "");
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
    },
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageCount = table.getPageCount();

  // Snap a stale/out-of-range page back into bounds — e.g. a hand-edited
  // `?page=99` URL, or the list shrinking below the current page after a
  // delete. (An empty list has 0 pages; leave it alone.)
  useEffect(() => {
    if (pageCount > 0 && pageIndex > pageCount - 1) setPageIndex(pageCount - 1);
  }, [pageCount, pageIndex, setPageIndex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder ?? t("dataTable.searchPlaceholder")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        {toolbar}
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.headClassName}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className="-ml-1 inline-flex items-center gap-1 rounded-none px-1 hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <CaretUpIcon className="size-3" />
                        ) : sorted === "desc" ? (
                          <CaretDownIcon className="size-3" />
                        ) : (
                          <CaretUpDownIcon className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage ?? t("dataTable.empty")}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.columnDef.meta?.cellClassName}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <CaretLeftIcon />
            {t("pagination.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pagination.page", {
              current: String(table.getState().pagination.pageIndex + 1),
              total: String(pageCount),
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            {t("pagination.next")}
            <CaretRightIcon />
          </Button>
        </div>
      )}
    </div>
  );
}
