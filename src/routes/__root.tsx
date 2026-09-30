import { HeadContent, Scripts, useRouterState, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";
// Preloaded below so the primary (latin, upright) JetBrains Mono weight fetches
// in parallel with the stylesheet instead of only after CSS parses — cuts the
// swap delay on the LCP text.
import jetbrainsMonoUrl from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url";
import { ThemeProvider } from "../components/ThemeProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import { resolveLocaleFn } from "../server/locale";

// Google Tag Manager. The container (configured at tagmanager.google.com) owns
// every tag — GA4 (G-MQCCS24ZLS) is wired up inside it, NOT loaded directly
// here, so events are never double-counted. Production builds only, so local
// dev traffic never reaches the container.
export const GTM_CONTAINER_ID = "GTM-TW4JDCC7";
const gtmScripts = import.meta.env.PROD
  ? [
      {
        children:
          "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});" +
          "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';" +
          "j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})" +
          `(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`,
      },
    ]
  : [];

export const Route = createRootRoute({
  // Preserve the admin locale across navigation; public UI always uses English.
  // Resolve the preference once so admin SSR has no language flash.
  loader: () => resolveLocaleFn(),
  staleTime: Infinity,
  head: () => ({
    scripts: gtmScripts,
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Unconstrained",
      },
    ],
    links: [
      {
        rel: "preload",
        href: jetbrainsMonoUrl,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.svg?v=bubble-tea-2",
        type: "image/svg+xml",
      },
      // PNG fallback for anything that doesn't render SVG favicons.
      {
        rel: "icon",
        href: "/favicon-32.png?v=bubble-tea-2",
        type: "image/png",
        sizes: "32x32",
      },
      // iOS "Add to Home Screen" tile (Safari ignores the manifest icons).
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png?v=bubble-tea-2",
        sizes: "180x180",
      },
      {
        rel: "manifest",
        href: "/manifest.json?v=bubble-tea-2",
      },
      // Feed auto-discovery: RSS readers resolve /feed.xml from any page URL.
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "Unconstrained",
        href: "/feed.xml",
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const locale = Route.useLoaderData();
  const isAdmin = useRouterState({
    select: (s) => s.location.pathname === "/admin" || s.location.pathname.startsWith("/admin/"),
  });
  return (
    // suppressHydrationWarning: next-themes writes the theme `class` +
    // `data-theme` onto <html> on the client, which the SSR markup can't match.
    <html lang={isAdmin && locale === "zh-TW" ? "zh-Hant" : "en"} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {/* GTM's no-JS fallback (standard second half of the snippet). */}
        {import.meta.env.PROD && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        <ThemeProvider defaultTheme={isAdmin ? "system" : "light"}>
          <I18nProvider initialLocale={locale} fixedLocale={isAdmin ? undefined : "en"}>
            {children}
          </I18nProvider>
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
