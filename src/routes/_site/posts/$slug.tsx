import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { postDataFn } from "@/server/public";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_site/posts/$slug")({
  loader: async ({ params }) => {
    const data = await postDataFn({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  component: PostPage,
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA");
}

function PostPage() {
  const { post, html } = Route.useLoaderData();

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <time>{formatDate(post.date)}</time>
          <span>·</span>
          <span>{post.readingTime} min read</span>
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Link key={t.slug} to="/tags/$slug" params={{ slug: t.slug }}>
                <Badge variant="secondary">{t.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </header>
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
