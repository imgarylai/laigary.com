import { createFileRoute, Link } from "@tanstack/react-router";
import { tagsDataFn } from "@/server/public";
import { PromptLine } from "@/components/terminal/ui";
import { FS_BLOG } from "@/lib/fsmap";

export const Route = createFileRoute("/_site/tags/")({
  loader: () => tagsDataFn(),
  component: TagsPage,
});

function TagsPage() {
  const tags = Route.useLoaderData();

  return (
    <div className="tm-page-narrow">
      <PromptLine style={{ margin: "0 0 16px" }}>{FS_BLOG.tags.prompt()}</PromptLine>
      {tags.length === 0 ? (
        <div style={{ color: "var(--tm-muted)", fontSize: 12 }}>// no tags yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {tags.map((t) => (
            <Link
              key={t.slug}
              to="/posts"
              search={{ tag: t.slug }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 4px",
                borderBottom: "1px dashed var(--tm-border)",
                color: "var(--tm-fg)",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              <span>
                <span style={{ color: "var(--tm-accent)" }}>#</span>
                {t.name}
              </span>
              <span style={{ color: "var(--tm-muted)", fontSize: 11 }}>
                {t.count} post{t.count > 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
