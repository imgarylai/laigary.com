import { createFileRoute } from "@tanstack/react-router";
import { getPostBySlug } from "@/db/queries";
import { postTemplate, articleTemplate } from "@/lib/og/templates";
import { serveOgImage } from "@/server/og";

export const Route = createFileRoute("/api/og/posts/$slug")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        serveOgImage(request, async ({ branding }) => {
          const post = await getPostBySlug(params.slug);
          if (!post) {
            return articleTemplate({
              title: "Post not found",
              branding,
              dateLabel: null,
              kicker: null,
            });
          }
          return postTemplate({
            title: post.title,
            dateLabel: post.date.slice(0, 10),
          });
        }),
    },
  },
});
