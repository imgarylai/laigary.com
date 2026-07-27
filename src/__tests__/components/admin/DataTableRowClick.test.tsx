// @vitest-environment jsdom
//
// The whole row as a click target (#180). Opening a post used to mean hitting
// the title text exactly — a thin target in an otherwise empty column.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "en" }),
}));

type Row = { id: string; title: string };

const data: Row[] = [
  { id: "p1", title: "First post" },
  { id: "p2", title: "Second post" },
];

const columns: ColumnDef<Row, unknown>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <a href={`/edit/${row.original.id}`}>{row.original.title}</a>,
  },
  {
    id: "actions",
    header: "",
    cell: () => <button type="button">actions</button>,
  },
];

function renderTable(onRowActivate?: (row: Row) => void) {
  render(<DataTable columns={columns} data={data} onRowActivate={onRowActivate} />);
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("DataTable row activation", () => {
  it("should open the row from a click on inert cell content", () => {
    const onRowActivate = vi.fn();
    renderTable(onRowActivate);

    fireEvent.click(screen.getByText("First post").closest("tr")!);

    expect(onRowActivate).toHaveBeenCalledWith(data[0]);
  });

  it("should pass the row that was actually clicked", () => {
    const onRowActivate = vi.fn();
    renderTable(onRowActivate);

    fireEvent.click(screen.getByText("Second post").closest("tr")!);

    expect(onRowActivate).toHaveBeenCalledWith(data[1]);
  });

  it("should leave the title link to do its own job", () => {
    // The link stays the keyboard and screen-reader affordance; the row click
    // is a pointer convenience on top of it, not a replacement.
    const onRowActivate = vi.fn();
    renderTable(onRowActivate);

    fireEvent.click(screen.getByText("First post"));

    expect(onRowActivate).not.toHaveBeenCalled();
  });

  it("should leave buttons in the row alone", () => {
    const onRowActivate = vi.fn();
    renderTable(onRowActivate);

    fireEvent.click(screen.getAllByRole("button", { name: "actions" })[0]);

    expect(onRowActivate).not.toHaveBeenCalled();
  });

  it("should not make rows look clickable when they are not", () => {
    renderTable(undefined);

    const row = screen.getByText("First post").closest("tr")!;
    expect(row.className).not.toContain("cursor-pointer");
    // And clicking does nothing rather than throwing.
    expect(() => fireEvent.click(row)).not.toThrow();
  });

  it("should mark rows as clickable when they are", () => {
    renderTable(vi.fn());

    expect(screen.getByText("First post").closest("tr")!.className).toContain("cursor-pointer");
  });
});
