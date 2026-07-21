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
      <h1 className="tm-ivhome__title">./interview/ — 面試準備筆記</h1>
      <p className="tm-ivhome__lead">我自己準備工程師面試的過程中累積的筆記。</p>

      <AsciiRule className="tm-rule--pre" />
      <div className="tm-meta">
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
      <AsciiRule className="tm-rule--post" />

      <PromptLine>$ ls .</PromptLine>
      <div className="tm-dirlist">
        {sections.map((s) => (
          <Link
            key={s.slug}
            to="/interview/$section"
            params={{ section: s.slug }}
            className="tm-home-dir"
          >
            <span className="tm-home-dir__label">./{s.slug}</span>
            <span className="tm-home-dir__desc">{s.blurb}</span>
            <span className="tm-home-dir__meta">{s.count} notes →</span>
          </Link>
        ))}
      </div>

      {recent.length > 0 && (
        <>
          <PromptLine className="tm-prompt--tight">$ ls -t ./notes/ | head -5</PromptLine>
          <div className="tm-rows">
            {recent.map((n) => (
              <Link
                key={n.slug}
                to="/interview/$section/$slug"
                params={{ section: n.section, slug: n.slug }}
                className="tm-archive-row"
              >
                <span className="tm-archive-row__date">{n.date.slice(5)}</span>
                <span>
                  <span className="tm-archive-row__section">[{n.section}] </span>
                  {n.title}
                </span>
                <span className="tm-archive-row__read">{n.minutes}m</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
