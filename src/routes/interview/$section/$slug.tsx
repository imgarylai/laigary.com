import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { noteDataFn } from "@/server/public";
import { AsciiRule, PromptLine, ReadingProgress } from "@/components/terminal/ui";
import { FS_INTERVIEW } from "@/lib/fsmap";

export const Route = createFileRoute("/interview/$section/$slug")({
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
    <>
      <ReadingProgress />
      <article className="tm-page-narrow">
        <PromptLine style={{ margin: "0 0 6px" }}>
          {FS_INTERVIEW.note.prompt({ sect: note.section, slug: note.slug })}
        </PromptLine>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "baseline",
            flexWrap: "wrap",
            marginBottom: 6,
            fontSize: 11,
          }}
        >
          <span style={{ color: "var(--tm-accent)" }}>[{note.sectionLabel}]</span>
          <span style={{ color: "var(--tm-dim)" }}>·</span>
          <span style={{ color: "var(--tm-muted)" }}>{note.date}</span>
          <span style={{ color: "var(--tm-dim)" }}>·</span>
          <span style={{ color: "var(--tm-muted)" }}>{note.minutes} min read</span>
        </div>

        <h1 style={{ fontSize: 20, margin: "8px 0 4px", lineHeight: 1.35, fontWeight: 600 }}>
          {note.title}
        </h1>
        <AsciiRule style={{ margin: "18px 0 22px" }} />

        <div className="tm-prose" dangerouslySetInnerHTML={{ __html: html }} />

        {note.tags.length > 0 && (
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px dashed var(--tm-border)" }}>
            <span style={{ color: "var(--tm-muted)", fontSize: 11, marginRight: 10 }}>--tags</span>
            {note.tags.map((tag) => (
              <span
                key={tag}
                style={{ color: "var(--tm-accent)", fontSize: 11.5, marginRight: 10 }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", gap: 14, fontSize: 12 }}>
          <Link
            to="/interview/$section"
            params={{ section: note.section }}
            style={{ color: "var(--tm-muted)", textDecoration: "none" }}
          >
            ← cd ../{note.section}
          </Link>
          <Link to="/interview" style={{ color: "var(--tm-muted)", textDecoration: "none" }}>
            cd ~
          </Link>
        </div>
      </article>
    </>
  );
}
