import { describe, expect, it } from "vitest";
import { parseListSearch } from "@/components/admin/list-search";
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
