import { createServerFn } from "@tanstack/react-start";
import { type Locale, defaultLocale } from "@/i18n";

// Resolve the UI locale from a cookie (set when the visitor toggles language),
// falling back to the request's Accept-Language, then the default. Pure so it
// can be unit-tested; exported for that reason.
export function pickLocale(cookie: string | undefined, acceptLanguage: string | undefined): Locale {
  if (cookie === "en" || cookie === "zh-TW") return cookie;
  const primary = acceptLanguage?.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("zh")) return "zh-TW";
  return defaultLocale;
}

// Reads the two request-scoped values `pickLocale` decides from. Split out of
// the wrapper so the names it reads are pinned: `pickLocale` is pure and proves
// the precedence, but nothing else would catch a misspelt cookie key or header
// name — both of which fail silently, leaving every visitor on the default
// locale. The helpers are dynamic-imported so this module stays out of the
// client bundle.
export async function resolveLocaleImpl(): Promise<Locale> {
  const { getCookie, getRequestHeader } = await import("@tanstack/react-start/server");
  return pickLocale(getCookie("locale"), getRequestHeader("accept-language"));
}

// Server function called by the root loader so the initial HTML renders in the
// visitor's locale (no first-paint flash).
/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const resolveLocaleFn = createServerFn({ method: "GET" }).handler(resolveLocaleImpl);
/* v8 ignore stop */
