import { createFileRoute, Link } from "@tanstack/react-router";
import { homeDataFn } from "@/server/public";
import { SITE_ORIGIN, serializeJsonLd, webSiteLd } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { AsciiRule, PromptLine, TmPage, TmMeta, TmDirLink, TmDirCells } from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";
import { fmtDate } from "@/lib/date";

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

type DirEntry = {
  label: string;
  desc: string;
  meta: string;
  to: string;
  params?: Record<string, string>;
};

function Home() {
  const { whoami, intro, postCount, tagCount, latestDate } = Route.useLoaderData();
  const { t } = useI18n();

  const dirs: DirEntry[] = [
    {
      label: "./posts/",
      desc: t("blog.home.descPosts"),
      meta: `${postCount} ${t("blog.home.postsUnit")}`,
      to: "/posts",
    },
    {
      label: "./tags/",
      desc: t("blog.home.descTags"),
      meta: `${tagCount} ${t("blog.home.tagsUnit")}`,
      to: "/tags",
    },
    { label: "./interview/", desc: t("blog.home.descInterview"), meta: "→", to: "/interview" },
    {
      label: "./about.md",
      desc: t("blog.home.descAbout"),
      meta: "→",
      to: "/$slug",
      params: { slug: "about" },
    },
  ];

  return (
    <TmPage>
      <pre className="m-0 text-xs leading-normal text-tm-muted">
        {`$ whoami\n${whoami || "gary lai"}\n$ cat ./README.md`}
      </pre>

      {intro && <p className="mt-3.5 mb-3 text-base leading-relaxed">{intro}</p>}

      <AsciiRule className="mt-4 mb-1" />
      <TmMeta>
        <span>
          {postCount} {t("blog.home.postsUnit")}
        </span>
        <span>·</span>
        <span>
          {tagCount} {t("blog.home.tagsUnit")}
        </span>
        {latestDate && (
          <>
            <span>·</span>
            <span>{t("blog.home.updated", { date: fmtDate(latestDate.slice(0, 10)) })}</span>
          </>
        )}
      </TmMeta>
      <AsciiRule className="mt-1 mb-6" />

      <PromptLine>{FS_BLOG.home.prompt()}</PromptLine>
      <div className="mb-8 flex flex-col">
        {dirs.map((d) => (
          <TmDirLink key={d.label} to={d.to} params={d.params}>
            <TmDirCells label={d.label} desc={d.desc} meta={d.meta} />
          </TmDirLink>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-tm-muted">
        <Link to="/posts" className="text-tm-accent no-underline">
          $ cd ./posts
        </Link>
        {t("blog.home.cta")}
      </p>
    </TmPage>
  );
}
