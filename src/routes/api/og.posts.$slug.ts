import { createFileRoute } from "@tanstack/react-router";
import { getPostBySlug } from "@/db/queries";
import { articleTemplate, formatOgDateFromIsoDay } from "@/lib/og/templates";
import { serveOgImage } from "@/server/og";

/** Tags are capped because the row is one line: a post carrying eight of them
 *  would push the block wider than the card rather than wrap. */
const MAX_TAGS = 4;

function postMeta(post: { readingTime: number; tags: readonly { name: string }[] }): string[] {
  // Padded to the width of the longest key, matching the alignment the article
  // page uses in its own front-matter block.
  const rows = [`reading: ${post.readingTime} min`];
  if (post.tags.length > 0) {
    const shown = post.tags.slice(0, MAX_TAGS).map((t) => t.name);
    const rest = post.tags.length - shown.length;
    rows.push(`tags:    [${shown.join(", ")}${rest > 0 ? `, +${rest}` : ""}]`);
  }
  return rows;
}

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
            // `$ cat ./posts/<slug>.md` is the page's own prompt line
            // (FS_BLOG.post.prompt), and the command is real: that URL returns
            // the markdown.
            kicker: post ? `./posts/${params.slug}.md` : null,
            // The page prints title/date/reading/tags above its <h1>; the card
            // carries the two rows the rest of it does not already say — the
            // title is the hero and the date is in the footer, so repeating
            // them here would only crowd the block.
            meta: post ? postMeta(post) : undefined,
          });
        }),
    },
  },
});
