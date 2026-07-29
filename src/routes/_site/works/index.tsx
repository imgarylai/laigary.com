import { createFileRoute } from "@tanstack/react-router";
import { worksDataFn } from "@/server/public";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import {
  AsciiRule,
  PromptLine,
  TmPage,
  TmDirList,
  TmDirLink,
  TmDirCells,
  TmEmpty,
} from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";
import { fmtYearRange } from "@/lib/date";

// No validateSearch and no paging, unlike /posts: a portfolio is a couple of
// dozen entries, and paging it would hide work rather than help anyone find it.
// Revisit past ~40. Ordering (pinned, then year) is already done in SQL, so
// there is no pinned block to split out either.
export const Route = createFileRoute("/_site/works/")({
  loader: () => worksDataFn(),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: "Works",
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/works`,
            image: `${SITE_ORIGIN}/api/og`,
            type: "website",
          }),
        ]
      : [],
    links: canonicalLink(`${SITE_ORIGIN}/works`),
  }),
  component: WorksPage,
});

function WorksPage() {
  const { works } = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <TmPage>
      <PromptLine>{FS_BLOG.works.prompt()}</PromptLine>
      <p className="mt-3 mb-4 text-sm leading-relaxed text-tm-muted">{t("blog.works.lead")}</p>
      <AsciiRule className="mb-4" />

      {works.length === 0 ? (
        <TmEmpty>{t("blog.works.noneYet")}</TmEmpty>
      ) : (
        <TmDirList className="mb-8">
          {works.map((work) => (
            <TmDirLink key={work.slug} to="/works/$slug" params={{ slug: work.slug }}>
              <TmDirCells
                label={`./${work.slug}/`}
                desc={work.summary}
                // The star marks a pinned entry. Rows are already ordered
                // pinned-first, so this explains the ordering rather than
                // being the only signal.
                meta={`${work.pinned ? "★ " : ""}${fmtYearRange(work.year, work.endYear)}`}
              />
            </TmDirLink>
          ))}
        </TmDirList>
      )}
    </TmPage>
  );
}
