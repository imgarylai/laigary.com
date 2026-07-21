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
      <pre style={{ margin: 0, color: "var(--tm-muted)", fontSize: 11.5, lineHeight: 1.5 }}>
        {`$ whoami\n${whoami || "gary lai"}\n$ cat ./README.md`}
      </pre>

      {intro && <p style={{ margin: "14px 0 12px", fontSize: 14, lineHeight: 1.8 }}>{intro}</p>}

      <AsciiRule style={{ margin: "18px 0 4px" }} />
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 12,
          color: "var(--tm-muted)",
          margin: "4px 0",
          flexWrap: "wrap",
        }}
      >
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
      <AsciiRule style={{ margin: "4px 0 24px" }} />

      <PromptLine style={{ margin: "0 0 10px" }}>{FS_BLOG.home.prompt()}</PromptLine>
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
        {dirs.map((d) => (
          <Link
            key={d.label}
            to={d.to}
            params={d.params}
            className="tm-home-dir"
            style={{
              width: "100%",
              padding: "14px 8px",
              borderBottom: "1px dashed var(--tm-border)",
              color: "var(--tm-fg)",
              textDecoration: "none",
            }}
          >
            <span style={{ color: "var(--tm-accent)", fontSize: 13.5 }}>{d.label}</span>
            <span style={{ fontSize: 13, color: "var(--tm-fg)" }}>{d.desc}</span>
            <span style={{ color: "var(--tm-muted)", fontSize: 11, whiteSpace: "nowrap" }}>
              {d.meta}
            </span>
          </Link>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "var(--tm-muted)", lineHeight: 1.8 }}>
        <Link to="/posts" style={{ color: "var(--tm-accent)", textDecoration: "none" }}>
          $ cd ./posts
        </Link>
        {"  — 直接開始讀 / jump straight to the writing"}
      </div>
    </div>
  );
}
