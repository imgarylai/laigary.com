import { createFileRoute } from "@tanstack/react-router";
import { getWorkBySlug } from "@/db/queries";
import { articleTemplate } from "@/lib/og/templates";
import { serveOgImage } from "@/server/og";
import { fmtYearRange } from "@/lib/date";

export const Route = createFileRoute("/api/og/works/$slug")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        serveOgImage(request, async ({ branding }) => {
          const work = await getWorkBySlug(params.slug);
          return articleTemplate({
            title: work?.title ?? "Work not found",
            branding,
            // The year is the date that means something for a portfolio entry;
            // the publish date is when the write-up went up, which nobody cares
            // about on a share card.
            dateLabel: work ? fmtYearRange(work.year, work.endYear) : null,
            kicker: `./works/${params.slug}.md`,
          });
        }),
    },
  },
});
