import { createFileRoute, notFound } from "@tanstack/react-router";
import { noteDataFn } from "@/server/public";

export const Route = createFileRoute("/_site/interview/$section/$slug")({
  loader: async ({ params }) => {
    const data = await noteDataFn({ data: { section: params.section, slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  component: NotePage,
});

function NotePage() {
  const { note, html } = Route.useLoaderData();

  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{note.title}</h1>
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
