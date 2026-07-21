import { createFileRoute, Link } from "@tanstack/react-router";
import { homeDataFn } from "@/server/public";
import { AsciiRule, PromptLine } from "@/components/terminal/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";
import { fmtDate } from "@/lib/date";

export const Route = createFileRoute("/_site/")({
  loader: () => homeDataFn(),
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
    <div className="tm-page">
      <pre className="tm-whoami">{`$ whoami\n${whoami || "gary lai"}\n$ cat ./README.md`}</pre>

      {intro && <p className="tm-intro">{intro}</p>}

      <AsciiRule className="tm-rule--pre" />
      <div className="tm-meta">
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
      </div>
      <AsciiRule className="tm-rule--post" />

      <PromptLine>{FS_BLOG.home.prompt()}</PromptLine>
      <div className="tm-dirlist">
        {dirs.map((d) => (
          <Link key={d.label} to={d.to} params={d.params} className="tm-home-dir">
            <span className="tm-home-dir__label">{d.label}</span>
            <span className="tm-home-dir__desc">{d.desc}</span>
            <span className="tm-home-dir__meta">{d.meta}</span>
          </Link>
        ))}
      </div>

      <p className="tm-cta">
        <Link to="/posts" className="tm-cta__link">
          $ cd ./posts
        </Link>
        {t("blog.home.cta")}
      </p>
    </div>
  );
}
