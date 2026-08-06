import { createFileRoute } from "@tanstack/react-router";
import { getPostBySlug } from "@/db/queries";
import { postTemplate, articleTemplate } from "@/lib/og/templates";
import { plainExcerpt } from "@/lib/og/excerpt";
import { serveOgImage } from "@/server/og";

/**
 * Excerpt budget, in half-width columns.
 *
 * The card is 1200px wide with 72px of padding and the excerpt is set at 24px
 * in a monospace face, so a line holds roughly 73 columns. Measured against a
 * real render, this lands CJK on three full lines and English on three or four
 * — English wraps at word boundaries, so it never packs a line to the column
 * count. Both clear the rule with room to spare, which is what the budget is
 * for.
 */
const EXCERPT_WIDTH = 73 * 3;

export const Route = createFileRoute("/api/og/posts/$slug")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        serveOgImage(request, async ({ branding }) => {
          const post = await getPostBySlug(params.slug);
          // Nothing to `cat`: fall back to the plain headline card the other
          // routes use, rather than a front-matter block for a file that does
          // not exist.
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
            branding,
            // The ISO day, matching the `date:` row the article page prints.
            dateLabel: post.date.slice(0, 10),
            // `$ cat ./posts/<slug>.md` is the page's own prompt line
            // (FS_BLOG.post.prompt), and the command is real: that URL returns
            // the markdown.
            kicker: `./posts/${params.slug}.md`,
            // Prefer the hand-written excerpt; fall back to the opening of the
            // article so a post that never got one still shows its own words.
            excerpt: plainExcerpt(post.excerpt || post.contentMd, EXCERPT_WIDTH),
          });
        }),
    },
  },
});
