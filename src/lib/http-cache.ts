// Policy for the edge cache in `src/start.ts`. Pure and separate from the
// middleware so the decisions — what may be cached, and under what key — are
// testable without a Workers runtime.

/**
 * How long the edge holds a page.
 *
 * A day, because the traffic this exists for is crawlers: they sweep hundreds
 * of distinct URLs once and come back tomorrow, so a short TTL expires before
 * the next sweep and buys almost nothing. Staleness is not the price of the
 * long TTL — the content version in the cache key retires every page the
 * moment something is published.
 *
 * `max-age=0` keeps browsers revalidating so a reader never holds a stale page
 * across a publish; `s-maxage` is the part the shared cache honours.
 */
export const EDGE_CACHE_CONTROL = "public, max-age=0, s-maxage=86400";

/**
 * Path prefixes that must never be cached.
 *
 * `/admin` and `/api` are also the two `robots.txt` disallows — anything
 * behind auth, or rendered per request, belongs to one caller.
 */
const UNCACHEABLE_PREFIXES = ["/admin", "/api", "/mcp", "/_serverFn"];

/**
 * Whether a request of this method may be ANSWERED from the cache.
 *
 * HEAD qualifies: uptime monitors and some crawlers use it, and without this
 * every one of those ran a full SSR render and its D1 queries. It reads the
 * entry a GET stored — the cache key is always built as a GET — and only the
 * headers come back.
 *
 * Storing is a narrower question and stays GET-only at the call site: whether a
 * HEAD render still carries a body by the time the middleware sees it is a
 * runtime detail, and an empty one stored under the GET key would serve blank
 * pages to everyone after it.
 */
export function isCacheableMethod(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

/** Whether a document request for `pathname` may be served from a shared cache. */
export function isCacheablePath(pathname: string): boolean {
  return !UNCACHEABLE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Whether a rendered response may be stored.
 *
 * A `Set-Cookie` is the tell for a response that carries something belonging to
 * one visitor; storing it would hand that cookie to everyone who follows.
 */
export function isCacheableResponse(response: Response): boolean {
  return response.status === 200 && !response.headers.has("Set-Cookie");
}

/**
 * Query parameters that change what a public page renders.
 *
 * `page` and `tag` are the only two any public route reads (`/posts` and
 * `/interview/$section` declare them in `validateSearch`; the section route
 * also puts them in `loaderDeps`, so they select the rows the server returns).
 *
 * ADD TO THIS LIST WHEN A PUBLIC ROUTE GAINS A SEARCH PARAM — otherwise the
 * edge answers `?newParam=x` with the document rendered without it.
 */
const CACHE_KEY_PARAMS = ["page", "tag"] as const;

/**
 * The URL a cached page is filed under.
 *
 * Three things beyond the path decide which document a visitor is owed:
 *
 * The locale is resolved server-side and baked into the HTML (from a cookie,
 * else `Accept-Language`), so two visitors on the same URL can be owed
 * different documents — keying on it keeps a zh-TW reader's page away from an
 * English one. The content version is what makes the day-long TTL safe:
 * publishing bumps it, every previously cached page is filed under a key nobody
 * asks for again, and the next request re-renders.
 *
 * Everything else in the query string is DROPPED, which is the opposite of the
 * obvious approach and the more important half of this function. Keying on the
 * request's own query string meant `?utm_source=twitter` on a shared link
 * missed the entry `/` had already stored, and — the part that actually
 * matters — that the number of cache keys per page was unbounded: anything
 * appending `?a=1`, `?a=2`, … got a full SSR render and its D1 queries every
 * time, with the cache unable to absorb any of it. An allowlist bounds the keys
 * per page at (locales x versions x page x tag) no matter what arrives.
 *
 * Dropping them is safe because nothing else varies with them: canonical and
 * `og:url` are built from `SITE_ORIGIN` plus a clean path, never from the
 * request URL. Rebuilding the query string from the allowlist also normalises
 * its order, so `?tag=go&page=2` and `?page=2&tag=go` stop being two entries.
 */
export function cacheKeyUrl(requestUrl: string, locale: string, version: string): string {
  const url = new URL(requestUrl);
  const params = new URLSearchParams();
  for (const name of CACHE_KEY_PARAMS) {
    const value = url.searchParams.get(name);
    if (value !== null) params.set(name, value);
  }
  params.set("__locale", locale);
  params.set("__v", version);
  url.search = params.toString();
  return url.toString();
}

/** Read one cookie out of a raw `Cookie` header. */
export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}
