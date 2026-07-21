import { createFileRoute } from "@tanstack/react-router";
import { getInterviewNote } from "@/db/queries";
import { articleTemplate, formatOgDate } from "@/lib/og/templates";
import { serveOgImage } from "@/server/og";

export const Route = createFileRoute("/api/og/interview/$sect/$slug")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        serveOgImage(request, async ({ branding }) => {
          const note = await getInterviewNote(params.sect, params.slug);
          return articleTemplate({
            title: note?.title ?? "Note not found",
            branding,
            dateLabel: formatOgDate(note?.publishedAt),
            kicker: `./interview/${params.sect}/`,
          });
        }),
    },
  },
});
