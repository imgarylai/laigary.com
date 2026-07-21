// @vitest-environment jsdom
//
// DataTable's search box supports a controlled mode (globalFilter +
// onGlobalFilterChange) so list pages can hold the filter in the route's
// search params — the fix for admin filters resetting when navigating into an
// item and back.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/admin/DataTable";

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: "en" }),
}));

afterEach(cleanup);

type Row = { name: string };
const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: "name", header: "Name" }];
const data: Row[] = [{ name: "apple" }, { name: "banana" }];

describe("DataTable search", () => {
  it("should filter rows by internal state when uncontrolled", () => {
    render(<DataTable columns={columns} data={data} searchPlaceholder="search" />);
    fireEvent.change(screen.getByPlaceholderText("search"), { target: { value: "app" } });
    expect(screen.getByText("apple")).toBeDefined();
    expect(screen.queryByText("banana")).toBeNull();
  });

  it("should filter rows by the globalFilter prop when controlled", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="search"
        globalFilter="ban"
        onGlobalFilterChange={() => {}}
      />,
    );
    expect(screen.getByText("banana")).toBeDefined();
    expect(screen.queryByText("apple")).toBeNull();
  });

  it("should report input changes through the callback when controlled", () => {
    const onChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="search"
        globalFilter=""
        onGlobalFilterChange={onChange}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("search"), { target: { value: "ba" } });
    expect(onChange).toHaveBeenCalledWith("ba");
    // controlled: rows only change when the prop does
    expect(screen.getByText("apple")).toBeDefined();
    expect(screen.getByText("banana")).toBeDefined();
  });
});
