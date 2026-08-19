// @vitest-environment happy-dom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";

// Deterministic labels: t(key) returns the key (+ params) so queries are stable.
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({
    t: (k: string, p?: Record<string, string>) => (p ? `${k} ${p.current}/${p.total}` : k),
    locale: "en",
  }),
}));

import { DataTable, type DataTableColumnDef } from "@/components/admin/DataTable";

type Row = { name: string; n: number };

const columns: DataTableColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "n", header: "N", enableSorting: false },
];

const data: Row[] = [
  { name: "Bravo", n: 2 },
  { name: "Alpha", n: 1 },
  { name: "Charlie", n: 3 },
];

afterEach(() => cleanup());

function bodyRowText() {
  const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1); // drop header
  return rows.map((r) => r.textContent);
}

describe("DataTable", () => {
  it("renders every row", () => {
    render(<DataTable columns={columns} data={data} searchPlaceholder="search" />);
    expect(bodyRowText()).toHaveLength(3);
  });

  it("filters rows by the global search box", () => {
    render(<DataTable columns={columns} data={data} searchPlaceholder="search" />);
    fireEvent.change(screen.getByPlaceholderText("search"), { target: { value: "alph" } });
    const rows = bodyRowText();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain("Alpha");
  });

  it("sorts ascending when a sortable header is clicked", () => {
    render(<DataTable columns={columns} data={data} searchPlaceholder="search" />);
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(bodyRowText().map((t) => t?.replace(/[0-9]/g, ""))).toEqual([
      "Alpha",
      "Bravo",
      "Charlie",
    ]);
  });

  it("paginates when rows exceed the page size", () => {
    render(<DataTable columns={columns} data={data} searchPlaceholder="search" pageSize={2} />);
    expect(bodyRowText()).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /pagination\.next/ }));
    expect(bodyRowText()).toHaveLength(1);
  });

  it("shows the controlled page and reports page changes instead of paging internally", () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="search"
        pageSize={2}
        pageIndex={1}
        onPageChange={onPageChange}
      />,
    );
    // pageIndex=1 → the second page (the leftover third row).
    expect(bodyRowText()).toHaveLength(1);
    // Paging is controlled: clicking Prev reports the target index, it does not
    // move the table on its own.
    fireEvent.click(screen.getByRole("button", { name: /pagination\.prev/ }));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it("snaps an out-of-range controlled page back into bounds", () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="search"
        pageSize={2}
        pageIndex={9}
        onPageChange={onPageChange}
      />,
    );
    // 3 rows / pageSize 2 → 2 pages (max index 1); a stale index 9 is clamped.
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("does not clamp when the list is empty (no pages to snap to)", () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={[]}
        searchPlaceholder="search"
        emptyMessage="nothing here"
        pageIndex={0}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText("nothing here")).toBeDefined();
    // An empty list has 0 pages — the clamp effect must leave the page alone.
    expect(onPageChange).not.toHaveBeenCalled();
  });
});

// Server-driven mode: `data` is one page the server already filtered and
// sorted, and `rowCount` is what the pager divides. The table has to stop
// doing all three itself, or it filters an already-filtered page and pages a
// list it can only see 20 rows of.
describe("DataTable server-driven mode", () => {
  it("pages by rowCount rather than by the rows it was handed", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="search"
        pageSize={20}
        rowCount={100}
      />,
    );
    // 3 rows on screen but 100 behind them: 5 pages, not 1.
    expect(screen.getByText("pagination.page 1/5")).toBeDefined();
  });

  it("renders the page it was given instead of re-filtering it", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="search"
        globalFilter="alph"
        onGlobalFilterChange={vi.fn()}
        rowCount={3}
      />,
    );
    // A client-side filter would cut this to the one matching row. The server
    // already applied the filter, so every row it returned must be shown.
    expect(bodyRowText()).toHaveLength(3);
  });

  it("reports a sort instead of reordering the page itself", () => {
    const onSortingChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="search"
        sorting={[]}
        onSortingChange={onSortingChange}
        rowCount={100}
      />,
    );

    fireEvent.click(screen.getByText("Name"));

    expect(onSortingChange).toHaveBeenCalledWith([{ id: "name", desc: false }]);
    // Unsorted locally — the next page from the server is what reorders it.
    expect(bodyRowText()?.[0]).toContain("Bravo");
  });

  it("re-seeds the search box when the filter changes from outside", () => {
    // Back/forward navigation rewrites `q` without anyone typing. The box keeps
    // a draft copy for the debounce, so it has to notice that and catch up —
    // otherwise it shows the previous search forever.
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="search"
        globalFilter="alph"
        onGlobalFilterChange={vi.fn()}
        filterDebounceMs={300}
        rowCount={3}
      />,
    );
    expect((screen.getByPlaceholderText("search") as HTMLInputElement).value).toBe("alph");

    rerender(
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="search"
        globalFilter=""
        onGlobalFilterChange={vi.fn()}
        filterDebounceMs={300}
        rowCount={3}
      />,
    );

    expect((screen.getByPlaceholderText("search") as HTMLInputElement).value).toBe("");
  });
});
