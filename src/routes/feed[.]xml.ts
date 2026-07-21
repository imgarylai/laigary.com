import { createFileRoute } from "@tanstack/react-router";
import { buildFeedXml } from "@/server/feed";

export const Route = createFileRoute("/feed.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await buildFeedXml(), {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
