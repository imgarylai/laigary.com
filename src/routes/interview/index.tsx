import { createFileRoute } from "@tanstack/react-router";
import { interviewDataFn } from "@/server/public";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import {
  AsciiRule,
  TmPage,
  TmMeta,
  TmDirList,
  TmDirLink,
  TmDirCells,
  TmRowLink,
  TmRowCells,
} from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/interview/")({
  loader: () => interviewDataFn(),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: "Interview",
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/interview`,
            image: `${SITE_ORIGIN}/api/og`,
            type: "website",
          }),
        ]
      : [],
    links: canonicalLink(`${SITE_ORIGIN}/interview`),
  }),
  component: InterviewHome,
});

function InterviewHome() {
  const { sections, recent } = Route.useLoaderData();
  const { t } = useI18n();
  const totalNotes = sections.reduce((n, s) => n + s.count, 0);

  return (
    <TmPage>
      <h1 className="mb-1.5 text-lg font-semibold">{t("blog.interview.title")}</h1>
      <p className="mb-4 text-sm leading-relaxed text-tm-muted">{t("blog.interview.lead")}</p>

      <AsciiRule className="mt-2 mb-1" />
      <TmMeta>
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
      </TmMeta>
      <AsciiRule className="mt-1 mb-7" />
      <h2 className="public-section-title">{t("public.topics")}</h2>
      <TmDirList className="mb-9">
        {sections.map((s) => (
          <TmDirLink key={s.slug} to="/interview/$section" params={{ section: s.slug }}>
            <TmDirCells
              label={s.label}
              desc={s.blurb}
              meta={t("blog.interview.notesArrow", { count: String(s.count) })}
            />
          </TmDirLink>
        ))}
      </TmDirList>

      {recent.length > 0 && (
        <>
          <h2 className="public-section-title">{t("public.recentNotes")}</h2>
          <div className="flex flex-col">
            {recent.map((n) => (
              <TmRowLink
                key={n.slug}
                to="/interview/$section/$slug"
                params={{ section: n.section, slug: n.slug }}
              >
                <TmRowCells
                  date={n.date.slice(5)}
                  title={
                    <>
                      <span className="text-xs text-tm-dim">[{n.section}] </span>
                      {n.title}
                    </>
                  }
                  read={`${n.minutes}m`}
                />
              </TmRowLink>
            ))}
          </div>
        </>
      )}
    </TmPage>
  );
}
