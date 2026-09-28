import { createFileRoute, Link } from "@tanstack/react-router";
import { homeDataFn } from "@/server/public";
import { SITE_ORIGIN, serializeJsonLd, webSiteLd } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { TmPage } from "@/features/terminal";
import { WRITING_LINK } from "@/features/public-site/navigation";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/_site/")({
  loader: () => homeDataFn(),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? ogMeta({
          title: loaderData.siteName,
          siteName: loaderData.siteName,
          url: SITE_ORIGIN,
          image: `${SITE_ORIGIN}/api/og`,
          type: "website",
          description: loaderData.intro || undefined,
        })
      : [],
    links: canonicalLink(`${SITE_ORIGIN}/`),
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: serializeJsonLd(webSiteLd(loaderData.siteName, loaderData.socialUrls)),
          },
        ]
      : [],
  }),
  component: Home,
});

function Home() {
  const { whoami, intro } = Route.useLoaderData();
  const { t } = useI18n();
  return (
    <TmPage>
      <section className="public-hero">
        <div className="public-eyebrow">{whoami || t("public.brand")}</div>
        <h1>{t("public.statement")}</h1>
        {intro && <p>{intro}</p>}
        <Link {...WRITING_LINK} className="public-primary-link">
          {t("public.exploreWriting")} <span aria-hidden>↗</span>
        </Link>
      </section>
      <div className="public-explore">
        <Link {...WRITING_LINK}>
          <h2>{t("public.writing")}</h2>
          <p>{t("blog.home.descPosts")}</p>
        </Link>
        <Link to="/works">
          <h2>{t("public.work")}</h2>
          <p>{t("blog.home.descWorks")}</p>
        </Link>
      </div>
      <div className="public-secondary-links">
        <Link to="/interview">{t("public.notes")}</Link>
        <Link to="/tags">{t("public.topics")}</Link>
        <Link to="/labs">{t("public.labs")}</Link>
        <Link to="/$slug" params={{ slug: "about" }}>
          {t("public.about")}
        </Link>
      </div>
    </TmPage>
  );
}
