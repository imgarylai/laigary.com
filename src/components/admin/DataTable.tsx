import { useEffect, useRef, useState } from "react";
import {
  type ColumnDef,
  type RowData,
  type SortingState,
  flexRender,
  functionalUpdate,
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

/**
 * Whether a click landed on something that handles its own activation — a link,
 * a button, or anything inside the row's `⋯` menu.
 *
 * The row navigates to the editor, so without this the Delete item would open
 * the post on its way to opening the confirmation, and the "view live" link
 * would do both at once (#180).
 */
export function isSelfHandledTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest("a, button, input, [role='menuitem'], [role='menu'], [role='dialog']") !== null
  );
}

// Shared admin list table (posts / notes / tags).
//
// Two modes. By default the caller hands over every row and the table searches
// / sorts / paginates client-side — fine at this blog's scale and it keeps a
// list snappy with no per-interaction round-trip. Pass `rowCount` and the table
// switches to server-driven: `data` is already the page, and search / sort /
// page changes are reported to the caller to turn into a new query. That mode
// exists for lists where "load everything" got expensive — see
// `getAdminInterviewNotes`.
export function DataTable<T>({
  columns,
  data,
  searchPlaceholder,
  toolbar,
  pageSize = 20,
  emptyMessage,
  globalFilter: controlledFilter,
  onGlobalFilterChange,
  filterDebounceMs = 0,
  pageIndex: controlledPageIndex,
  onPageChange,
  sorting: controlledSorting,
  onSortingChange,
  rowCount,
  onRowActivate,
}: {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  /** Clicking anywhere inert in a row runs this — the row's primary action.
   *  Pointer affordance only; the title stays a real link so the keyboard and
   *  screen readers have the same destination. */
  onRowActivate?: (row: T) => void;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  pageSize?: number;
  emptyMessage?: string;
  /** Controlled search text — pass together with onGlobalFilterChange to hold
      the filter outside the table (e.g. in the route's search params). */
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  /** Hold `onGlobalFilterChange` back until typing pauses for this long. Only
      worth setting when a filter change costs a round-trip; 0 reports every
      keystroke, which is what a client-side filter wants. */
  filterDebounceMs?: number;
  /** Controlled 0-based page index — pass together with onPageChange to hold
      the current page outside the table (e.g. in the route's search params) so
      a reload restores it. Omit both to let the table page internally. */
  pageIndex?: number;
  onPageChange?: (index: number) => void;
  /** Controlled sort. Required in server-driven mode, where the sort decides
      which rows the page contains rather than just their order on screen. */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Total rows behind `data`. Passing it declares `data` to be one page that
      the server already filtered and sorted, and the table stops doing any of
      those three itself. */
  rowCount?: number;
}) {
  const { t } = useI18n();
  const serverDriven = rowCount !== undefined;

  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = controlledSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;

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
    onSortingChange: (updater) => {
      setSorting(functionalUpdate(updater, sorting));
    },
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === "function" ? updater(globalFilter) : updater;
      setGlobalFilter(typeof next === "string" ? next : "");
    },
    onPaginationChange: (updater) => {
      setPageIndex(functionalUpdate(updater, { pageIndex, pageSize }).pageIndex);
    },
    globalFilterFn: "includesString",
    manualPagination: serverDriven,
    manualSorting: serverDriven,
    manualFiltering: serverDriven,
    rowCount,
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

  // The search box keeps its own copy of the text so it stays responsive while
  // a debounced change is still pending. `pushedFilter` is the last value this
  // component handed upwards; anything else arriving from outside (back/forward
  // navigation, a cleared filter) is an external change and re-seeds the box —
  // without that check, the resync would fight the user mid-word.
  const [draftFilter, setDraftFilter] = useState(globalFilter);
  const pushedFilter = useRef(globalFilter);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (globalFilter !== pushedFilter.current) {
      pushedFilter.current = globalFilter;
      setDraftFilter(globalFilter);
    }
  }, [globalFilter]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  function handleFilterInput(value: string) {
    setDraftFilter(value);
    clearTimeout(debounceTimer.current);
    const push = () => {
      pushedFilter.current = value;
      setGlobalFilter(value);
    };
    if (filterDebounceMs > 0) debounceTimer.current = setTimeout(push, filterDebounceMs);
    else push();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder ?? t("dataTable.searchPlaceholder")}
            value={draftFilter}
            onChange={(e) => handleFilterInput(e.target.value)}
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
              <TableRow
                key={row.id}
                className={onRowActivate ? "cursor-pointer" : undefined}
                onClick={
                  onRowActivate
                    ? (event) => {
                        if (isSelfHandledTarget(event.target)) return;
                        onRowActivate(row.original);
                      }
                    : undefined
                }
              >
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
