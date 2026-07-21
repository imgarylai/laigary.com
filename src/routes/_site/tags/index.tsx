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
    <div className="tm-page--narrow">
      <PromptLine className="tm-prompt--pad">{FS_BLOG.tags.prompt()}</PromptLine>
      {tags.length === 0 ? (
        <div className="tm-empty">// no tags yet.</div>
      ) : (
        <div className="tm-taglist">
          {tags.map((t) => (
            <Link key={t.slug} to="/posts" search={{ tag: t.slug }} className="tm-taglist__row">
              <span>
                <span className="tm-taglist__hash">#</span>
                {t.name}
              </span>
              <span className="tm-taglist__count">
                {t.count} post{t.count > 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
