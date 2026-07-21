import { createFileRoute, Link } from "@tanstack/react-router";
import { tagsDataFn } from "@/server/public";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_site/tags/")({
  loader: () => tagsDataFn(),
  component: TagsPage,
});

function TagsPage() {
  const tags = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tags yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link key={t.slug} to="/tags/$slug" params={{ slug: t.slug }}>
              <Badge variant="secondary">
                {t.name} <span className="ml-1 opacity-60">{t.count}</span>
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
