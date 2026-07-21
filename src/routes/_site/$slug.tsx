import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageDataFn } from "@/server/public";

// Catch-all for DB-backed content pages (e.g. /now, /about). Matches last, so
// concrete routes like /posts and /tags take precedence.
export const Route = createFileRoute("/_site/$slug")({
  loader: async ({ params }) => {
    const data = await pageDataFn({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  component: PagePage,
});

function PagePage() {
  const { page, html } = Route.useLoaderData();

  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
