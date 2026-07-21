import { createFileRoute, Link } from "@tanstack/react-router";
import { tagDataFn } from "@/server/public";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_site/tags/$slug")({
  loader: ({ params }) => tagDataFn({ data: { slug: params.slug } }),
  component: TagPage,
});

function TagPage() {
  const { slug, posts } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">#{slug}</h1>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts with this tag.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Link key={p.slug} to="/posts/$slug" params={{ slug: p.slug }} className="block">
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                </CardHeader>
                {p.excerpt && (
                  <CardContent className="text-sm text-muted-foreground">{p.excerpt}</CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
