import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { sectionDataFn } from "@/server/public";
import { AsciiRule, PromptLine } from "@/components/terminal/ui";
import { FS_INTERVIEW } from "@/lib/fsmap";

export const Route = createFileRoute("/interview/$section/")({
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
    <div className="tm-page">
      <PromptLine style={{ margin: "0 0 8px" }}>
        {FS_INTERVIEW.section.prompt({ sect: section.slug })}
      </PromptLine>
      <h1 style={{ fontSize: 18, margin: "0 0 6px" }}>{section.label}</h1>
      {section.blurb && (
        <p style={{ color: "var(--tm-muted)", fontSize: 12.5, lineHeight: 1.7, margin: "0 0 8px" }}>
          {section.blurb}
        </p>
      )}
      <AsciiRule style={{ margin: "8px 0 20px" }} />

      {notes.length === 0 ? (
        <div style={{ color: "var(--tm-muted)", fontSize: 12, padding: "20px 0" }}>
          // no notes yet.
        </div>
      ) : (
        notes.map((n) => (
          <Link
            key={n.slug}
            to="/interview/$section/$slug"
            params={{ section: section.slug, slug: n.slug }}
            className="tm-archive-row"
            style={{
              padding: "8px 6px",
              borderBottom: "1px dashed var(--tm-border)",
              color: "var(--tm-fg)",
              fontSize: 12.5,
              textDecoration: "none",
            }}
          >
            <span style={{ color: "var(--tm-muted)", fontSize: 11 }}>{n.date.slice(5)}</span>
            <span>{n.title}</span>
            <span style={{ color: "var(--tm-dim)", textAlign: "right", fontSize: 11 }}>
              {n.minutes}m
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
