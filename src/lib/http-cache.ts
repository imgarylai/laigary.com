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
 * The URL a cached page is filed under.
 *
 * The request URL alone is not enough. The locale is resolved server-side and
 * baked into the HTML (from a cookie, else `Accept-Language`), so two visitors
 * on the same URL can be owed different documents — keying on it is what keeps
 * a zh-TW reader's page away from an English one. The content version is what
 * makes the day-long TTL safe: publishing bumps it, every previously cached
 * page is filed under a key nobody asks for again, and the next request
 * re-renders.
 */
export function cacheKeyUrl(requestUrl: string, locale: string, version: string): string {
  const url = new URL(requestUrl);
  url.searchParams.set("__locale", locale);
  url.searchParams.set("__v", version);
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
