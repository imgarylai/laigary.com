import { describe, expect, it } from "vitest";
import { parseListSearch, parseSortedListSearch } from "@/components/admin/list-search";
import { parsePostsListSearch } from "@/routes/admin/posts/-list-search";

describe("parseListSearch", () => {
  it("should keep q when it is a non-empty string", () => {
    expect(parseListSearch({ q: "hello" })).toEqual({ q: "hello" });
  });

  it("should drop q when it is empty or not a string", () => {
    expect(parseListSearch({ q: "" })).toEqual({ q: undefined });
    expect(parseListSearch({ q: 42 })).toEqual({ q: undefined });
    expect(parseListSearch({})).toEqual({ q: undefined });
  });

  it("should keep page when it is an integer above 1 (string or number)", () => {
    expect(parseListSearch({ page: "3" })).toEqual({ q: undefined, page: 3 });
    expect(parseListSearch({ page: 5 })).toEqual({ q: undefined, page: 5 });
  });

  it("should drop page for the default page 1, or invalid values", () => {
    // Page 1 is the default — omitted so the URL stays clean.
    expect(parseListSearch({ page: "1" })).toEqual({ q: undefined, page: undefined });
    expect(parseListSearch({ page: "0" })).toEqual({ q: undefined, page: undefined });
    expect(parseListSearch({ page: "-2" })).toEqual({ q: undefined, page: undefined });
    expect(parseListSearch({ page: "2.5" })).toEqual({ q: undefined, page: undefined });
    expect(parseListSearch({ page: "abc" })).toEqual({ q: undefined, page: undefined });
    expect(parseListSearch({})).toEqual({ q: undefined, page: undefined });
  });
});

// The notes list reads its sort out of the URL and hands it to SQL, so this
// parser is the boundary between a hand-editable string and the query.
describe("parseSortedListSearch", () => {
  it("should carry the sort column and direction through", () => {
    expect(parseSortedListSearch({ sort: "title", dir: "asc" })).toEqual({
      q: undefined,
      page: undefined,
      sort: "title",
      dir: "asc",
    });
  });

  it("should still parse the q and page it inherits", () => {
    expect(parseSortedListSearch({ q: "sum", page: "3", sort: "status", dir: "desc" })).toEqual({
      q: "sum",
      page: 3,
      sort: "status",
      dir: "desc",
    });
  });

  it("should drop sort when it is empty or not a string", () => {
    // The column id itself is not validated here — the server maps an unknown
    // one back to its default. Only the shape is checked.
    expect(parseSortedListSearch({ sort: "" }).sort).toBeUndefined();
    expect(parseSortedListSearch({ sort: 7 }).sort).toBeUndefined();
    expect(parseSortedListSearch({}).sort).toBeUndefined();
  });

  it("should drop a direction that is not asc or desc", () => {
    expect(parseSortedListSearch({ sort: "title", dir: "sideways" }).dir).toBeUndefined();
    expect(parseSortedListSearch({ sort: "title", dir: 1 }).dir).toBeUndefined();
  });

  it("should drop a direction with no column to apply it to", () => {
    // `?dir=asc` alone says nothing — keeping it would put a direction in the
    // URL that no sort reads.
    expect(parseSortedListSearch({ dir: "asc" })).toEqual({
      q: undefined,
      page: undefined,
      sort: undefined,
      dir: undefined,
    });
  });
});

describe("parsePostsListSearch", () => {
  it("should keep a valid status when given draft or published", () => {
    expect(parsePostsListSearch({ status: "draft" })).toEqual({ q: undefined, status: "draft" });
    expect(parsePostsListSearch({ q: "x", status: "published" })).toEqual({
      q: "x",
      status: "published",
    });
  });

  it("should drop status when the value is not a known status", () => {
    expect(parsePostsListSearch({ status: "bogus" })).toEqual({ q: undefined, status: undefined });
    expect(parsePostsListSearch({ status: 1 })).toEqual({ q: undefined, status: undefined });
  });
});
