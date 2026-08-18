import { createMiddleware, createStart } from "@tanstack/react-start";
import {
  cacheKeyUrl,
  edgeCacheControl,
  hasCacheBypassParam,
  isCacheableMethod,
  isCacheablePath,
  isCacheableResponse,
  readCookie,
} from "@/lib/http-cache";
import { isMarkdownRequest } from "@/lib/md-path";

// Edge cache for public pages.
//
// Every uncached document request runs the route's loaders, and each of those
// is a D1 round trip — so the read volume tracked request count, not content
// size or reader count. Crawlers dominate that count on a personal site (a
// third of the requests in one sample were for URLs that do not exist at all),
// and no amount of query tuning helps with traffic that should never have
// reached the database.
//
// Cloudflare does not cache a Worker's own responses on `Cache-Control` alone,
// so this stores them explicitly. Correctness rests on the cache key, built in
// `lib/http-cache`: the locale (the one request-dependent thing baked into the
// SSR HTML) and the content version (bumped by every mutation, which is what
// lets the TTL be a full day). The theme is not in the key because it never
// reaches the server — next-themes reads localStorage and paints before hydration.
const edgeCache = createMiddleware({ type: "request" }).server(async (ctx) => {
  const cache = getEdgeCache();
  const method = ctx.request.method;
  if (
    !cache ||
    ctx.handlerType !== "router" ||
    !isCacheableMethod(method) ||
    !isCacheablePath(ctx.pathname) ||
    hasCacheBypassParam(ctx.request.url)
  ) {
    return ctx.next();
  }

  const [{ pickLocale }, { getContentVersion }, { getNextScheduledPublishAt, unixNow }] =
    await Promise.all([
      import("@/server/locale"),
      import("@/db/queries/_revalidate"),
      import("@/db/queries/_visibility"),
    ]);
  const locale = pickLocale(
    readCookie(ctx.request.headers.get("cookie"), "locale"),
    ctx.request.headers.get("accept-language") ?? undefined,
  );
  const key = new Request(cacheKeyUrl(ctx.request.url, locale, await getContentVersion()), {
    method: "GET",
  });

  // How long this document may live: normally a day, but never past the moment
  // a scheduled post or note comes due — that is the one publish with no write
  // behind it to bump the content version.
  const nextPublish = await getNextScheduledPublishAt();
  const ttl = nextPublish === null ? null : nextPublish - unixNow();

  // A HEAD is answered from the entry a GET stored — the key is a GET either
  // way. Its body is dropped here rather than left to the runtime to strip.
  const hit = await cache.match(key);
  if (hit) return mark(method === "HEAD" ? new Response(null, hit) : hit, "HIT", ttl);

  const { response } = await ctx.next();
  if (!isCacheableResponse(response)) return response;

  const stamped = mark(response, "MISS", ttl);
  // GET only. A HEAD render's body may already be gone by the time it reaches
  // here, and storing an empty one under the GET key would serve blank pages
  // to every reader after it.
  if (method === "GET") await cache.put(key, stamped.clone());
  return stamped;
});

/**
 * Copy a response so its headers can be written to, tagging how it was served.
 *
 * Rebuilt rather than mutated because a Response from the router (or from the
 * cache) can have immutable headers.
 *
 * `Cache-Control` is re-applied on BOTH paths, not just before `cache.put`.
 * Cloudflare rewrites the stored copy's `max-age` to the zone's Browser Cache
 * TTL (4 hours by default), so a hit came back telling browsers to hold the
 * page for four hours — exactly what `max-age=0` exists to prevent. The edge
 * entry is retired by the content version the moment anything is published;
 * without this, a reader who had already loaded the page would not see that
 * for another four hours.
 *
 * `x-edge-cache` makes the layer verifiable from outside: `curl -s -D - -o
 * /dev/null` twice on a page, and the second should say HIT.
 */
function mark(response: Response, state: "HIT" | "MISS", ttl: number | null): Response {
  const copy = new Response(response.body, response);
  copy.headers.set("x-edge-cache", state);
  copy.headers.set("Cache-Control", edgeCacheControl(ttl));
  return copy;
}

/**
 * `caches.default` where it exists.
 *
 * Absent under Vite's dev server and in tests, where the middleware simply
 * passes through — the DOM `caches` (a CacheStorage without `.default`) is the
 * reason for the property check rather than a bare `typeof caches`.
 */
function getEdgeCache(): Cache | null {
  if (typeof caches === "undefined") return null;
  const store = caches as unknown as { default?: Cache };
  return store.default ?? null;
}

/**
 * The markdown twin of every content page: `<page path>.md` returns the
 * markdown the page was rendered from (`src/server/md.ts`).
 *
 * Middleware rather than file routes because the rule is ONE rule over the
 * whole public URL space, and because a route could not own it anyway:
 * `/posts/$slug` matches `/posts/hello.md` — the param takes the whole segment,
 * `.md` and all — so the router would answer it with the React 404 page. This
 * runs before the router is ever consulted, which also sidesteps its `Accept`
 * check (a client asking for `text/markdown` alone gets refused there).
 *
 * Ordered AFTER `edgeCache` so it runs INSIDE it: a markdown response is stored
 * and served exactly like the HTML twin, including the `s-maxage` cap that
 * makes a scheduled publish land on time.
 */
const markdownSource = createMiddleware({ type: "request" }).server(async (ctx) => {
  if (ctx.handlerType !== "router" || !isMarkdownRequest(ctx.request.method, ctx.pathname)) {
    return ctx.next();
  }
  const { serveMarkdown } = await import("@/server/md");
  return serveMarkdown(ctx.pathname);
});

export const startInstance = createStart(() => ({
  requestMiddleware: [edgeCache, markdownSource],
}));
