// @vitest-environment node
//
// Cache policy for the edge cache in src/start.ts. Every one of these decides
// whether a page can be handed to a visitor it was not rendered for, so they
// are tested on their own rather than through the middleware.

import { describe, it, expect } from "vitest";
import {
  EDGE_CACHE_CONTROL,
  cacheKeyUrl,
  isCacheablePath,
  isCacheableResponse,
  readCookie,
} from "@/lib/http-cache";

describe("isCacheablePath", () => {
  it("should allow the public pages", () => {
    expect(isCacheablePath("/")).toBe(true);
    expect(isCacheablePath("/posts")).toBe(true);
    expect(isCacheablePath("/interview/coding")).toBe(true);
    expect(isCacheablePath("/tags/go")).toBe(true);
  });

  it("should refuse the admin, api, mcp and server-function paths", () => {
    expect(isCacheablePath("/admin")).toBe(false);
    expect(isCacheablePath("/admin/posts/new")).toBe(false);
    expect(isCacheablePath("/api/og")).toBe(false);
    expect(isCacheablePath("/mcp")).toBe(false);
    expect(isCacheablePath("/_serverFn/whatever")).toBe(false);
  });

  it("should not refuse a public path that merely starts with the same letters", () => {
    // A prefix check without the boundary would take /admin-guide with it, and
    // a post called "api-design" would silently stop being cached.
    expect(isCacheablePath("/admin-guide")).toBe(true);
    expect(isCacheablePath("/posts/api-design")).toBe(true);
  });
});

describe("isCacheableResponse", () => {
  it("should accept a plain 200", () => {
    expect(isCacheableResponse(new Response("ok", { status: 200 }))).toBe(true);
  });

  it("should refuse a response carrying a Set-Cookie", () => {
    // Storing one would serve that visitor's cookie to everyone after them.
    const res = new Response("ok", { status: 200, headers: { "Set-Cookie": "locale=zh-TW" } });
    expect(isCacheableResponse(res)).toBe(false);
  });

  it("should refuse non-200 responses", () => {
    expect(isCacheableResponse(new Response("nope", { status: 404 }))).toBe(false);
    expect(isCacheableResponse(new Response("boom", { status: 500 }))).toBe(false);
    expect(isCacheableResponse(new Response(null, { status: 302 }))).toBe(false);
  });
});

describe("cacheKeyUrl", () => {
  it("should key different locales apart on the same url", () => {
    const en = cacheKeyUrl("https://laigary.com/posts", "en", "1");
    const zh = cacheKeyUrl("https://laigary.com/posts", "zh-TW", "1");
    expect(en).not.toBe(zh);
  });

  it("should key different content versions apart", () => {
    const before = cacheKeyUrl("https://laigary.com/posts", "en", "1");
    const after = cacheKeyUrl("https://laigary.com/posts", "en", "2");
    expect(before).not.toBe(after);
  });

  it("should keep the request's own query string", () => {
    // Page 2 of a section is a different document from page 1.
    const first = cacheKeyUrl("https://laigary.com/interview/coding", "en", "1");
    const second = cacheKeyUrl("https://laigary.com/interview/coding?page=2", "en", "1");
    expect(second).toContain("page=2");
    expect(first).not.toBe(second);
  });

  it("should be stable for the same url, locale and version", () => {
    const a = cacheKeyUrl("https://laigary.com/", "en", "7");
    const b = cacheKeyUrl("https://laigary.com/", "en", "7");
    expect(a).toBe(b);
  });
});

describe("readCookie", () => {
  it("should find a cookie among others", () => {
    expect(readCookie("theme=dark; locale=zh-TW; other=1", "locale")).toBe("zh-TW");
  });

  it("should return undefined when the cookie or the header is missing", () => {
    expect(readCookie("theme=dark", "locale")).toBeUndefined();
    expect(readCookie(null, "locale")).toBeUndefined();
  });

  it("should not match a cookie whose name merely ends with the wanted one", () => {
    // `my_locale=en` must not answer a request for `locale`.
    expect(readCookie("my_locale=en", "locale")).toBeUndefined();
  });
});

describe("EDGE_CACHE_CONTROL", () => {
  it("should let shared caches hold the page while browsers revalidate", () => {
    // max-age=0 is what stops a reader holding a stale page across a publish;
    // s-maxage is the part the edge honours.
    expect(EDGE_CACHE_CONTROL).toContain("max-age=0");
    expect(EDGE_CACHE_CONTROL).toContain("s-maxage=86400");
    expect(EDGE_CACHE_CONTROL).toContain("public");
  });
});
