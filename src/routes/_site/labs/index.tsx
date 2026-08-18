import { createFileRoute } from "@tanstack/react-router";
import { labsChromeFn } from "@/server/public";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import {
  AsciiRule,
  PromptLine,
  TmPage,
  TmDirList,
  TmDirLink,
  TmDirCells,
} from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";
import { LABS } from "@/lib/labs";

// The listing is the static `@/lib/labs` registry, not content rows — adding a
// lab is a code change either way, since each one ships a hand-written
// playground. The loader is only here for the DB-driven title template.
export const Route = createFileRoute("/_site/labs/")({
  loader: () => labsChromeFn({ data: { title: "Labs" } }),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: "Labs",
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/labs`,
            image: `${SITE_ORIGIN}/api/og`,
            type: "website",
          }),
        ]
      : [],
    links: canonicalLink(`${SITE_ORIGIN}/labs`),
  }),
  component: LabsPage,
});

function LabsPage() {
  const { t } = useI18n();

  return (
    <TmPage>
      <PromptLine>{FS_BLOG.labs.prompt()}</PromptLine>
      <p className="mt-3 mb-4 text-sm leading-relaxed text-tm-muted">{t("blog.labs.lead")}</p>
      <AsciiRule className="mb-4" />

      <TmDirList className="mb-8">
        {LABS.map((lab) => (
          <TmDirLink key={lab.slug} to={lab.to}>
            <TmDirCells label={`./${lab.slug}`} desc={lab.tagline} meta={lab.kind} />
          </TmDirLink>
        ))}
      </TmDirList>
    </TmPage>
  );
}
