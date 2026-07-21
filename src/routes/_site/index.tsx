import { createFileRoute, Link } from "@tanstack/react-router";
import { homeDataFn } from "@/server/public";
import { AsciiRule, PromptLine } from "@/components/terminal/ui";
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

  const dirs: DirEntry[] = [
    { label: "./posts/", desc: "生活筆記與隨筆", meta: `${postCount} posts`, to: "/posts" },
    { label: "./tags/", desc: "依主題瀏覽", meta: `${tagCount} tags`, to: "/tags" },
    { label: "./interview/", desc: "面試準備筆記", meta: "→", to: "/interview" },
    {
      label: "./about.md",
      desc: "關於我與聯絡方式",
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
        <span>{postCount} posts</span>
        <span>·</span>
        <span>{tagCount} tags</span>
        {latestDate && (
          <>
            <span>·</span>
            <span>updated {fmtDate(latestDate.slice(0, 10))}</span>
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
        {"  — 直接開始讀 / jump straight to the writing"}
      </p>
    </div>
  );
}
