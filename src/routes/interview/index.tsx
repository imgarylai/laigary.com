import { createFileRoute, Link } from "@tanstack/react-router";
import { interviewDataFn } from "@/server/public";
import { AsciiRule, PromptLine } from "@/components/terminal/ui";

export const Route = createFileRoute("/interview/")({
  loader: () => interviewDataFn(),
  component: InterviewHome,
});

function InterviewHome() {
  const { sections, recent } = Route.useLoaderData();
  const totalNotes = sections.reduce((n, s) => n + s.count, 0);

  return (
    <div className="tm-page">
      <h1 style={{ fontSize: 16, margin: "0 0 6px", fontWeight: 600 }}>
        ./interview/ — 面試準備筆記
      </h1>
      <p style={{ color: "var(--tm-muted)", fontSize: 12.5, lineHeight: 1.7, margin: "0 0 16px" }}>
        我自己準備工程師面試的過程中累積的筆記。
      </p>

      <AsciiRule style={{ margin: "8px 0 4px" }} />
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 12,
          color: "var(--tm-muted)",
          flexWrap: "wrap",
        }}
      >
        <span>{totalNotes} notes</span>
        <span>·</span>
        <span>{sections.length} sections</span>
        {recent[0] && (
          <>
            <span>·</span>
            <span>updated {recent[0].date}</span>
          </>
        )}
      </div>
      <AsciiRule style={{ margin: "4px 0 28px" }} />

      <PromptLine>$ ls .</PromptLine>
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 36 }}>
        {sections.map((s) => (
          <Link
            key={s.slug}
            to="/interview/$section"
            params={{ section: s.slug }}
            className="tm-home-dir"
            style={{
              padding: "16px 8px",
              borderBottom: "1px dashed var(--tm-border)",
              color: "var(--tm-fg)",
              textDecoration: "none",
            }}
          >
            <span style={{ color: "var(--tm-accent)", fontSize: 13.5 }}>./{s.slug}</span>
            <span style={{ fontSize: 12, color: "var(--tm-muted)", lineHeight: 1.6 }}>
              {s.blurb}
            </span>
            <span style={{ color: "var(--tm-muted)", fontSize: 11.5, whiteSpace: "nowrap" }}>
              {s.count} notes →
            </span>
          </Link>
        ))}
      </div>

      {recent.length > 0 && (
        <>
          <PromptLine style={{ margin: "0 0 8px" }}>$ ls -t ./notes/ | head -5</PromptLine>
          <div>
            {recent.map((n) => (
              <Link
                key={n.slug}
                to="/interview/$section/$slug"
                params={{ section: n.section, slug: n.slug }}
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
                <span>
                  <span style={{ color: "var(--tm-dim)", fontSize: 11 }}>[{n.section}] </span>
                  {n.title}
                </span>
                <span style={{ color: "var(--tm-dim)", textAlign: "right", fontSize: 11 }}>
                  {n.minutes}m
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
