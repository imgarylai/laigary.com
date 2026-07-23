import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";
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
  // Resolve the UI locale server-side so the initial HTML is in the right
  // language (no flash). staleTime: Infinity — the locale only changes via the
  // in-app toggle, so there's no need to re-run this on client navigations.
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
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
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
  return (
    // suppressHydrationWarning: next-themes writes the theme `class` +
    // `data-theme` onto <html> on the client, which the SSR markup can't match.
    <html lang={locale === "zh-TW" ? "zh-Hant" : "en"} suppressHydrationWarning>
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
        <ThemeProvider>
          <I18nProvider initialLocale={locale}>{children}</I18nProvider>
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
