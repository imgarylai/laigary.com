import { ArticleShare } from "@/features/public-site/ArticleShare";
import { ArticleHeader } from "@/features/public-site/ArticleHeader";
import { ArticleBody } from "@/features/public-site/ArticleBody";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { postDataFn } from "@/server/public";
import { SITE_ORIGIN, blogPostingLd, breadcrumbLd, serializeJsonLd } from "@/lib/json-ld";
import { canonicalLink, markdownAlternateLink, ogMeta } from "@/lib/og-meta";
import { AsciiRule, ReadingProgress, TmPage, Toc } from "@/features/terminal";
import { Comments } from "@/components/Comments";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/_site/posts/$slug")({
  loader: async ({ params }) => {
    const data = await postDataFn({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: loaderData.post.title,
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/posts/${loaderData.post.slug}`,
            image:
              loaderData.post.coverImageUrl ??
              `${SITE_ORIGIN}/api/og/posts/${loaderData.post.slug}`,
            type: "article",
            description: loaderData.description || undefined,
            publishedTime: loaderData.post.date,
            modifiedTime: loaderData.post.updatedAt,
          }),
        ]
      : [],
    links: loaderData
      ? [
          ...canonicalLink(`${SITE_ORIGIN}/posts/${loaderData.post.slug}`),
          ...markdownAlternateLink(`${SITE_ORIGIN}/posts/${loaderData.post.slug}`),
        ]
      : [],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: serializeJsonLd(
              blogPostingLd({
                ...loaderData.post,
                tags: loaderData.post.tags.map((tag) => tag.name),
              }),
            ),
          },
          {
            type: "application/ld+json",
            children: serializeJsonLd(
              breadcrumbLd([
                { name: "~", path: "/" },
                { name: "posts", path: "/posts" },
                { name: loaderData.post.title },
              ]),
            ),
          },
        ]
      : [],
  }),
  component: PostPage,
});

function PostPage() {
  const { post, html, toc, adjacent, giscus } = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <div className="public-reading-layout">
      <ReadingProgress />
      <Toc entries={toc} />
      <TmPage narrow>
        {/* lang: content is written in Traditional Chinese while <html lang>
            follows the UI locale — mark the content region so the language
            signals agree with the JSON-LD inLanguage declaration. */}
        <article lang="zh-Hant">
          <ArticleHeader title={post.title} date={post.date} minutes={post.readingTime} />
          <AsciiRule className="mb-8" />

          <ArticleBody html={html} title={post.title} />
        </article>

        <ArticleShare
          key={`${SITE_ORIGIN}/posts/${encodeURIComponent(post.slug)}`}
          title={post.title}
          url={`${SITE_ORIGIN}/posts/${encodeURIComponent(post.slug)}`}
        />

        {post.tags.length > 0 && (
          <div className="mt-8 border-t border-dashed border-tm-border pt-4">
            <span className="mr-2.5 text-xs text-tm-muted">{t("blog.post.tagsLabel")}</span>
            {post.tags.map((tg) => (
              <Link
                key={tg.slug}
                to="/tags/$slug"
                params={{ slug: tg.slug }}
                className="mr-2.5 text-xs text-tm-accent no-underline"
              >
                #{tg.name}
              </Link>
            ))}
          </div>
        )}

        {(adjacent.prev || adjacent.next) && (
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-dashed border-tm-border pt-4 text-xs">
            <div>
              {adjacent.prev && (
                <Link
                  to="/posts/$slug"
                  params={{ slug: adjacent.prev.slug }}
                  className="text-tm-fg no-underline"
                >
                  <span className="block text-xs text-tm-muted">{t("blog.post.older")}</span>
                  <span className="text-tm-accent">{adjacent.prev.title}</span>
                </Link>
              )}
            </div>
            <div className="text-right">
              {adjacent.next && (
                <Link
                  to="/posts/$slug"
                  params={{ slug: adjacent.next.slug }}
                  className="text-tm-fg no-underline"
                >
                  <span className="block text-xs text-tm-muted">{t("blog.post.newer")}</span>
                  <span className="text-tm-accent">{adjacent.next.title}</span>
                </Link>
              )}
            </div>
          </div>
        )}

        <Comments config={giscus} />

        <AsciiRule className="mt-10 mb-3" />
        <p className="text-sm leading-relaxed text-tm-muted">
          <Link to="/posts" className="text-tm-accent no-underline">
            {t("public.backWriting")}
          </Link>
        </p>
      </TmPage>
    </div>
  );
}
