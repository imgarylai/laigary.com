// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";

// Deterministic labels: t(key) returns the key (+ params) so queries are stable.
vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({
    t: (k: string, p?: Record<string, string>) => (p ? `${k} ${p.current}/${p.total}` : k),
    locale: "en",
  }),
}));

import { DataTable } from "@/components/admin/DataTable";

type Row = { name: string; n: number };

const columns: ColumnDef<Row, unknown>[] = [
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
});
