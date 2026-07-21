import { describe, expect, it } from "vitest";
import { parseListSearch, parsePostsListSearch } from "@/components/admin/list-search";

describe("parseListSearch", () => {
  it("should keep q when it is a non-empty string", () => {
    expect(parseListSearch({ q: "hello" })).toEqual({ q: "hello" });
  });

  it("should drop q when it is empty or not a string", () => {
    expect(parseListSearch({ q: "" })).toEqual({ q: undefined });
    expect(parseListSearch({ q: 42 })).toEqual({ q: undefined });
    expect(parseListSearch({})).toEqual({ q: undefined });
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
