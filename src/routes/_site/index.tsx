import { createFileRoute, Link } from "@tanstack/react-router";
import { homeDataFn } from "@/server/public";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_site/")({
  loader: () => homeDataFn(),
  component: Home,
});

function Home() {
  const { settings, posts } = Route.useLoaderData();
  const whoami = settings.whoami || settings.site_description || "";

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">{settings.site_name || "啟靈工程師"}</h1>
        {whoami && <p className="mt-3 text-muted-foreground">{whoami}</p>}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent posts</h2>
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
      </section>
    </div>
  );
}
