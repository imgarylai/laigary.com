import { createFileRoute, Link } from "@tanstack/react-router";
import { tagsDataFn } from "@/server/public";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { PromptLine, TmPage, TmEmpty } from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";

export const Route = createFileRoute("/_site/tags/")({
  loader: () => tagsDataFn(),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: "Tags",
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/tags`,
            image: `${SITE_ORIGIN}/api/og`,
            type: "website",
          }),
        ]
      : [],
    links: canonicalLink(`${SITE_ORIGIN}/tags`),
  }),
  component: TagsPage,
});

function TagsPage() {
  const { tags } = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <TmPage narrow>
      <PromptLine className="mb-4">{FS_BLOG.tags.prompt()}</PromptLine>
      {tags.length === 0 ? (
        <TmEmpty>{t("blog.tags.noneYet")}</TmEmpty>
      ) : (
        <div className="flex flex-col">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              to="/tags/$slug"
              params={{ slug: tag.slug }}
              className="flex items-center justify-between border-b border-dashed border-tm-border px-1 py-2 text-[13px] text-tm-fg no-underline"
            >
              <span>
                <span className="text-tm-accent">#</span>
                {tag.name}
              </span>
              <span className="text-[11px] text-tm-muted">
                {tag.count} {t("blog.tags.postsUnit")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </TmPage>
  );
}
