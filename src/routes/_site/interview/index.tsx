import { createFileRoute, Link } from "@tanstack/react-router";
import { interviewDataFn } from "@/server/public";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/_site/interview/")({
  loader: () => interviewDataFn(),
  component: InterviewPage,
});

function InterviewPage() {
  const sections = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Interview</h1>
      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sections yet.</p>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => (
            <Link
              key={s.slug}
              to="/interview/$section"
              params={{ section: s.slug }}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">
                    {s.label} <span className="ml-1 opacity-60">{s.count}</span>
                  </CardTitle>
                  {s.blurb && <CardDescription>{s.blurb}</CardDescription>}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
