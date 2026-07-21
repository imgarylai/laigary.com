import { createFileRoute } from "@tanstack/react-router";
import { siteTemplate } from "@/lib/og/templates";
import { serveOgImage } from "@/server/og";

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: ({ request }) =>
        serveOgImage(request, async ({ siteName, description, siteUrl }) =>
          siteTemplate({ siteName, description, siteUrl }),
        ),
    },
  },
});
