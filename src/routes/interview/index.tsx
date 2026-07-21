import { createFileRoute, Link } from "@tanstack/react-router";
import { interviewDataFn } from "@/server/public";
import { AsciiRule, PromptLine } from "@/components/terminal/ui";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/interview/")({
  loader: () => interviewDataFn(),
  component: InterviewHome,
});

function InterviewHome() {
  const { sections, recent } = Route.useLoaderData();
  const { t } = useI18n();
  const totalNotes = sections.reduce((n, s) => n + s.count, 0);

  return (
    <div className="tm-page">
      <h1 className="tm-ivhome__title">{t("blog.interview.title")}</h1>
      <p className="tm-ivhome__lead">{t("blog.interview.lead")}</p>

      <AsciiRule className="tm-rule--pre" />
      <div className="tm-meta">
        <span>
          {totalNotes} {t("blog.interview.notesUnit")}
        </span>
        <span>·</span>
        <span>
          {sections.length} {t("blog.interview.sectionsUnit")}
        </span>
        {recent[0] && (
          <>
            <span>·</span>
            <span>{t("blog.home.updated", { date: recent[0].date })}</span>
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
            <span className="tm-home-dir__meta">
              {t("blog.interview.notesArrow", { count: String(s.count) })}
            </span>
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
