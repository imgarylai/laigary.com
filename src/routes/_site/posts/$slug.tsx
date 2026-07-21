import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { postDataFn } from "@/server/public";
import { AsciiRule, PromptLine, ReadingProgress } from "@/components/terminal/ui";
import { FS_BLOG } from "@/lib/fsmap";

export const Route = createFileRoute("/_site/posts/$slug")({
  loader: async ({ params }) => {
    const data = await postDataFn({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  component: PostPage,
});

function PostPage() {
  const { post, html, toc } = Route.useLoaderData();

  return (
    <>
      <ReadingProgress />
      <article className="tm-page-narrow">
        <Link
          to="/posts"
          style={{
            display: "inline-block",
            color: "var(--tm-accent)",
            fontSize: 12,
            marginBottom: 18,
            textDecoration: "none",
          }}
        >
          $ cd ..
        </Link>

        <PromptLine style={{ margin: "0 0 6px" }}>
          {FS_BLOG.post.prompt({ slug: post.slug })}
        </PromptLine>
        <pre style={{ color: "var(--tm-muted)", fontSize: 11, margin: "0 0 8px" }}>
          {`---\ntitle:   "${post.title}"\ndate:    ${post.date.slice(0, 10)}\nreading: ${post.readingTime} min\ntags:    [${post.tags.map((t) => t.name).join(", ")}]\n---`}
        </pre>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "20px 0 10px",
            letterSpacing: "-0.01em",
            lineHeight: 1.35,
          }}
        >
          {post.title}
        </h1>
        <AsciiRule style={{ margin: "0 0 22px" }} />

        {toc.length > 0 && (
          <div
            style={{
              padding: "10px 14px",
              border: "1px dashed var(--tm-border)",
              marginBottom: 26,
              fontSize: 11.5,
            }}
          >
            <div style={{ color: "var(--tm-muted)", marginBottom: 4 }}>// table of contents</div>
            {toc.map((h, i) => (
              <div key={i} style={{ color: "var(--tm-fg)" }}>
                <span style={{ color: "var(--tm-dim)" }}>{String(i + 1).padStart(2, "0")}</span>
                {"  "}
                {h}
              </div>
            ))}
          </div>
        )}

        <div className="tm-prose" dangerouslySetInnerHTML={{ __html: html }} />

        {post.tags.length > 0 && (
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px dashed var(--tm-border)" }}>
            <span style={{ color: "var(--tm-muted)", fontSize: 11, marginRight: 10 }}>--tags</span>
            {post.tags.map((t) => (
              <Link
                key={t.slug}
                to="/posts"
                search={{ tag: t.slug }}
                style={{
                  marginRight: 10,
                  color: "var(--tm-accent)",
                  fontSize: 11.5,
                  textDecoration: "none",
                }}
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        <AsciiRule style={{ margin: "40px 0 12px" }} />
        <div style={{ fontSize: 12, color: "var(--tm-muted)", lineHeight: 1.7 }}>
          <Link to="/posts" style={{ color: "var(--tm-accent)", textDecoration: "none" }}>
            $ cd ..
          </Link>
          {"  — back to all posts"}
        </div>
      </article>
    </>
  );
}
