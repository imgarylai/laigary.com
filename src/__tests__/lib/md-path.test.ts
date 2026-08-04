// @vitest-environment node
//
// The URL half of the `.md` feature: which paths ask for markdown, and which
// document each one names. The middleware that consults this only runs inside a
// Worker, so this is where the mapping is pinned.
import { describe, it, expect } from "vitest";
import { isMarkdownRequest, parseMdPath } from "@/lib/md-path";

describe("isMarkdownRequest", () => {
  it("should accept GET and HEAD on a .md path when the extension is present", () => {
    expect(isMarkdownRequest("GET", "/posts/hello.md")).toBe(true);
    expect(isMarkdownRequest("HEAD", "/posts/hello.md")).toBe(true);
  });

  it("should reject a path without the extension when the method would qualify", () => {
    expect(isMarkdownRequest("GET", "/posts/hello")).toBe(false);
    // A slug that merely CONTAINS the extension is a different document.
    expect(isMarkdownRequest("GET", "/posts/hello.markdown")).toBe(false);
  });

  it("should reject a write method so it falls through to the router", () => {
    expect(isMarkdownRequest("POST", "/posts/hello.md")).toBe(false);
  });
});

describe("parseMdPath", () => {
  it("should name the four content shapes when the path mirrors a detail route", () => {
    expect(parseMdPath("/posts/hello.md")).toEqual({ kind: "post", slug: "hello" });
    expect(parseMdPath("/works/laigary.md")).toEqual({ kind: "work", slug: "laigary" });
    expect(parseMdPath("/about.md")).toEqual({ kind: "page", slug: "about" });
    expect(parseMdPath("/interview/coding/two-sum.md")).toEqual({
      kind: "note",
      section: "coding",
      slug: "two-sum",
    });
  });

  it("should name nothing when the path has no .md extension", () => {
    expect(parseMdPath("/posts/hello")).toBeNull();
  });

  it("should name nothing for a listing url, which has no markdown source", () => {
    // Two-segment listings are rejected outright; `/posts.md` parses as a page
    // and is left to miss in the pages table, which is why no reserved-word
    // list has to track the route tree.
    expect(parseMdPath("/interview/coding.md")).toBeNull();
    expect(parseMdPath("/tags/go.md")).toBeNull();
    expect(parseMdPath("/posts.md")).toEqual({ kind: "page", slug: "posts" });
  });

  it("should name nothing when the path is deeper than any content route", () => {
    expect(parseMdPath("/interview/coding/two-sum/extra.md")).toBeNull();
    expect(parseMdPath("/.md")).toBeNull();
  });

  it("should name nothing for a three-segment path outside the interview sub-site", () => {
    // Only /interview nests; a three-segment path anywhere else (an admin
    // screen, a future namespace) must not be read as a note.
    expect(parseMdPath("/admin/posts/new.md")).toBeNull();
  });

  it("should decode percent-escapes so a non-ascii slug reaches the query layer", () => {
    expect(parseMdPath("/posts/%E4%B8%AD%E6%96%87.md")).toEqual({ kind: "post", slug: "中文" });
  });

  it("should name nothing when an escape is malformed rather than throwing", () => {
    // decodeURIComponent throws on a truncated escape — a crawler sending one
    // must get the 404 body, not a 500 out of the middleware.
    expect(parseMdPath("/posts/%E4%B8.md")).toBeNull();
  });
});
