import { createMiddleware, createStart } from "@tanstack/react-start";
import {
  EDGE_CACHE_CONTROL,
  cacheKeyUrl,
  isCacheablePath,
  isCacheableResponse,
  readCookie,
} from "@/lib/http-cache";

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
  if (
    !cache ||
    ctx.handlerType !== "router" ||
    ctx.request.method !== "GET" ||
    !isCacheablePath(ctx.pathname)
  ) {
    return ctx.next();
  }

  const [{ pickLocale }, { getContentVersion }] = await Promise.all([
    import("@/server/locale"),
    import("@/db/queries/_revalidate"),
  ]);
  const locale = pickLocale(
    readCookie(ctx.request.headers.get("cookie"), "locale"),
    ctx.request.headers.get("accept-language") ?? undefined,
  );
  const key = new Request(cacheKeyUrl(ctx.request.url, locale, await getContentVersion()), {
    method: "GET",
  });

  const hit = await cache.match(key);
  if (hit) return mark(hit, "HIT");

  const { response } = await ctx.next();
  if (!isCacheableResponse(response)) return response;

  const stamped = mark(response, "MISS");
  stamped.headers.set("Cache-Control", EDGE_CACHE_CONTROL);
  await cache.put(key, stamped.clone());
  return stamped;
});

/**
 * Copy a response so its headers can be written to, tagging how it was served.
 *
 * Rebuilt rather than mutated because a Response from the router (or from the
 * cache) can have immutable headers. `x-edge-cache` makes the layer verifiable
 * from outside — `curl -I` twice on a page and the second should say HIT.
 */
function mark(response: Response, state: "HIT" | "MISS"): Response {
  const copy = new Response(response.body, response);
  copy.headers.set("x-edge-cache", state);
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

export const startInstance = createStart(() => ({
  requestMiddleware: [edgeCache],
}));
