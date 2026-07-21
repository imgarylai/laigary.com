import { createFileRoute, Link } from "@tanstack/react-router";
import { postsDataFn } from "@/server/public";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_site/posts/")({
  loader: () => postsDataFn(),
  component: PostsPage,
});

function PostsPage() {
  const posts = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts yet.</p>
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
