import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { sectionDataFn } from "@/server/public";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_site/interview/$section/")({
  loader: async ({ params }) => {
    const data = await sectionDataFn({ data: { slug: params.section } });
    if (!data) throw notFound();
    return data;
  },
  component: SectionPage,
});

function SectionPage() {
  const { section, notes } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{section.label}</h1>
        {section.blurb && <p className="text-muted-foreground">{section.blurb}</p>}
      </header>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <Link
              key={n.slug}
              to="/interview/$section/$slug"
              params={{ section: section.slug, slug: n.slug }}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{n.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
