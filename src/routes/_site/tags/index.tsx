import { createFileRoute, Link } from "@tanstack/react-router";
import { tagsDataFn } from "@/server/public";
import { PromptLine } from "@/components/terminal/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";

export const Route = createFileRoute("/_site/tags/")({
  loader: () => tagsDataFn(),
  component: TagsPage,
});

function TagsPage() {
  const tags = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <div className="tm-page--narrow">
      <PromptLine className="tm-prompt--pad">{FS_BLOG.tags.prompt()}</PromptLine>
      {tags.length === 0 ? (
        <div className="tm-empty">{t("blog.tags.noneYet")}</div>
      ) : (
        <div className="tm-taglist">
          {tags.map((tag) => (
            <Link key={tag.slug} to="/posts" search={{ tag: tag.slug }} className="tm-taglist__row">
              <span>
                <span className="tm-taglist__hash">#</span>
                {tag.name}
              </span>
              <span className="tm-taglist__count">
                {tag.count} {t("blog.tags.postsUnit")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
