import { createFileRoute } from "@tanstack/react-router";
import { getPageBySlug } from "@/db/queries";
import { articleTemplate } from "@/lib/og/templates";
import { serveOgImage } from "@/server/og";

export const Route = createFileRoute("/api/og/pages/$slug")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        serveOgImage(request, async ({ branding }) => {
          const page = await getPageBySlug(params.slug);
          return articleTemplate({
            title: page?.title ?? "Page not found",
            branding,
            dateLabel: null,
            kicker: `./${params.slug}.md`,
          });
        }),
    },
  },
});
