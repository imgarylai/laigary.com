import { createFileRoute } from "@tanstack/react-router";
import { getPostBySlug } from "@/db/queries";
import { articleTemplate, formatOgDateFromIsoDay } from "@/lib/og/templates";
import { serveOgImage } from "@/server/og";

export const Route = createFileRoute("/api/og/posts/$slug")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        serveOgImage(request, async ({ branding }) => {
          const post = await getPostBySlug(params.slug);
          return articleTemplate({
            title: post?.title ?? "Post not found",
            branding,
            dateLabel: post ? formatOgDateFromIsoDay(post.date) : null,
            kicker: null,
          });
        }),
    },
  },
});
