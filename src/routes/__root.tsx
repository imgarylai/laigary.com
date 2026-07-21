import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";
import { ThemeProvider } from "../components/ThemeProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import { resolveLocaleFn } from "../server/locale";

export const Route = createRootRoute({
  // Resolve the UI locale server-side so the initial HTML is in the right
  // language (no flash). staleTime: Infinity — the locale only changes via the
  // in-app toggle, so there's no need to re-run this on client navigations.
  loader: () => resolveLocaleFn(),
  staleTime: Infinity,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Psychedelic Engineer",
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
