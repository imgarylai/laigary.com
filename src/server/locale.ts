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

// Server function called by the root loader so the initial HTML renders in the
// visitor's locale (no first-paint flash). The request-scoped helpers are
// dynamic-imported so this module stays out of the client bundle.
export const resolveLocaleFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Locale> => {
    const { getCookie, getRequestHeader } = await import("@tanstack/react-start/server");
    return pickLocale(getCookie("locale"), getRequestHeader("accept-language"));
  },
);
