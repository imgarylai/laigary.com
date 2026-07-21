import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";
import { TM_NO_FLASH_SCRIPT } from "../components/terminal/theme";

export const Route = createRootRoute({
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
  return (
    // data-theme drives the terminal frontend palette (dark default). The inline
    // script below reconciles it from localStorage before first paint.
    // suppressHydrationWarning: both this script and next-themes (mounted in the
    // /admin layout) mutate <html> on the client, which the SSR markup can't match.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
        <script dangerouslySetInnerHTML={{ __html: TM_NO_FLASH_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
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
