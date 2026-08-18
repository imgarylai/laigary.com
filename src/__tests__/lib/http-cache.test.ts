// @vitest-environment node
//
// Cache policy for the edge cache in src/start.ts. Every one of these decides
// whether a page can be handed to a visitor it was not rendered for, so they
// are tested on their own rather than through the middleware.

import { describe, it, expect } from "vitest";
import {
  EDGE_CACHE_MAX_AGE,
  edgeCacheControl,
  cacheKeyUrl,
  hasCacheBypassParam,
  isCacheableMethod,
  isCacheablePath,
  isCacheableResponse,
  readCookie,
} from "@/lib/http-cache";

describe("isCacheableMethod", () => {
  it("should answer GET and HEAD from the cache", () => {
    // HEAD is what uptime monitors send. Excluding it meant every one of them
    // ran a full SSR render and its D1 queries.
    expect(isCacheableMethod("GET")).toBe(true);
    expect(isCacheableMethod("HEAD")).toBe(true);
  });

  it("should refuse methods that change state or carry a body", () => {
    expect(isCacheableMethod("POST")).toBe(false);
    expect(isCacheableMethod("PUT")).toBe(false);
    expect(isCacheableMethod("DELETE")).toBe(false);
    expect(isCacheableMethod("PATCH")).toBe(false);
    expect(isCacheableMethod("OPTIONS")).toBe(false);
  });
});

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

describe("hasCacheBypassParam", () => {
  it("bypasses the cache for a typed-in name", () => {
    // The value is whatever a visitor typed, so it can neither be a cache key
    // (unbounded) nor be dropped (a shared link would answer with the default).
    expect(hasCacheBypassParam("https://laigary.com/tools/wade-giles-name?name=%E7%8E%8B")).toBe(
      true,
    );
  });

  it("leaves the bare page — the one crawlers sweep — cacheable", () => {
    expect(hasCacheBypassParam("https://laigary.com/tools/wade-giles-name")).toBe(false);
    expect(hasCacheBypassParam("https://laigary.com/posts?page=2")).toBe(false);
    expect(hasCacheBypassParam("https://laigary.com/?utm_source=x")).toBe(false);
  });

  it("bypasses on an empty value too, since the param is still what varies", () => {
    expect(hasCacheBypassParam("https://laigary.com/tools/wade-giles-name?name=")).toBe(true);
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

  it("should keep the params a public route actually renders from", () => {
    // Page 2 of a section is a different document from page 1, and so is the
    // same page filtered by a tag.
    const first = cacheKeyUrl("https://laigary.com/interview/coding", "en", "1");
    const paged = cacheKeyUrl("https://laigary.com/interview/coding?page=2", "en", "1");
    const tagged = cacheKeyUrl("https://laigary.com/interview/coding?tag=go", "en", "1");

    expect(paged).toContain("page=2");
    expect(tagged).toContain("tag=go");
    expect(new Set([first, paged, tagged]).size).toBe(3);
  });

  it("should ignore a param no route reads", () => {
    // A shared link carrying ?utm_source= used to miss the entry the bare URL
    // had already stored, and paid a full SSR render plus its D1 queries.
    const bare = cacheKeyUrl("https://laigary.com/posts", "en", "1");
    const tracked = cacheKeyUrl("https://laigary.com/posts?utm_source=twitter", "en", "1");
    expect(tracked).toBe(bare);
  });

  it("should not let an arbitrary param multiply the keys for one page", () => {
    // The reason this is an allowlist and not a list of tracking params to
    // strip: with the request's query string in the key, the number of entries
    // per page is unbounded, and anything walking ?a=1, ?a=2, … renders every
    // one of them at the origin.
    const keys = new Set(
      ["a=1", "a=2", "a=3", "fbclid=xyz", "gclid=abc"].map((q) =>
        cacheKeyUrl(`https://laigary.com/?${q}`, "en", "1"),
      ),
    );
    expect(keys.size).toBe(1);
  });

  it("should file the same params in either order under one key", () => {
    const a = cacheKeyUrl("https://laigary.com/interview/coding?tag=go&page=2", "en", "1");
    const b = cacheKeyUrl("https://laigary.com/interview/coding?page=2&tag=go", "en", "1");
    expect(a).toBe(b);
  });

  it("should keep the path apart from the query string", () => {
    // Dropping unknown params must not collapse two different pages.
    const posts = cacheKeyUrl("https://laigary.com/posts?utm_source=x", "en", "1");
    const works = cacheKeyUrl("https://laigary.com/works?utm_source=x", "en", "1");
    expect(posts).not.toBe(works);
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

  it("should skip a segment carrying no value at all", () => {
    // Flagless segments show up in forwarded Cookie headers; indexOf returning
    // -1 there would slice the name from position 0 and match the wrong thing.
    expect(readCookie("HttpOnly; locale=en", "locale")).toBe("en");
    expect(readCookie("HttpOnly", "locale")).toBeUndefined();
  });

  it("should not match a cookie whose name merely ends with the wanted one", () => {
    // `my_locale=en` must not answer a request for `locale`.
    expect(readCookie("my_locale=en", "locale")).toBeUndefined();
  });
});

describe("edgeCacheControl", () => {
  it("should let shared caches hold the page for a day while browsers revalidate", () => {
    // max-age=0 is what stops a reader holding a stale page across a publish;
    // s-maxage is the part the edge honours.
    const header = edgeCacheControl(null);
    expect(header).toContain("max-age=0");
    expect(header).toContain(`s-maxage=${EDGE_CACHE_MAX_AGE}`);
    expect(header).toContain("public");
  });

  it("should expire the page when a scheduled post comes due instead of a day later", () => {
    // The one publish with no write behind it to bump the content version: the
    // cap is the only thing that retires the pages rendered without the post.
    expect(edgeCacheControl(600)).toContain("s-maxage=600");
  });

  it("should never hold a page past the day ceiling when the schedule is further out", () => {
    expect(edgeCacheControl(EDGE_CACHE_MAX_AGE * 7)).toContain(`s-maxage=${EDGE_CACHE_MAX_AGE}`);
  });

  it("should still store the page when the schedule is due this instant", () => {
    // s-maxage=0 would tell the shared cache not to store at all, knocking
    // every public page out of the edge rather than expiring one generation.
    expect(edgeCacheControl(0)).toContain("s-maxage=1");
    expect(edgeCacheControl(-30)).toContain("s-maxage=1");
  });
});
