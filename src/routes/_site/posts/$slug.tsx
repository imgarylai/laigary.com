import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { postDataFn } from "@/server/public";
import { SITE_ORIGIN, blogPostingLd, breadcrumbLd, serializeJsonLd } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { AsciiRule, PromptLine, ReadingProgress, TmPage } from "@/features/terminal";
import { Comments } from "@/components/Comments";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";

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
    links: loaderData ? canonicalLink(`${SITE_ORIGIN}/posts/${loaderData.post.slug}`) : [],
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
    <>
      <ReadingProgress />
      <TmPage narrow>
        <Link to="/posts" className="mb-[18px] inline-block text-xs text-tm-accent no-underline">
          $ cd ..
        </Link>

        <PromptLine className="mb-1.5">{FS_BLOG.post.prompt({ slug: post.slug })}</PromptLine>
        <pre className="m-0 mb-2 text-[11px] text-tm-muted">
          {`---\ntitle:   "${post.title}"\ndate:    ${post.date.slice(0, 10)}\nreading: ${post.readingTime} min\ntags:    [${post.tags.map((tg) => tg.name).join(", ")}]\n---`}
        </pre>

        {/* lang: content is written in Traditional Chinese while <html lang>
            follows the UI locale — mark the content region so the language
            signals agree with the JSON-LD inLanguage declaration. */}
        <article lang="zh-Hant">
          <h1 className="mt-5 mb-2.5 text-[22px] font-bold leading-[1.35] tracking-[-0.01em]">
            {post.title}
          </h1>
          <AsciiRule className="mb-[22px]" />

          {toc.length > 0 && (
            <div className="mb-[26px] border border-dashed border-tm-border px-3.5 py-2.5 text-[11.5px]">
              <div className="mb-1 text-tm-muted">{t("blog.post.toc")}</div>
              {toc.map((h, i) => (
                <div key={i} className="text-tm-fg">
                  <span className="mr-2 text-tm-dim">{String(i + 1).padStart(2, "0")}</span>
                  {h}
                </div>
              ))}
            </div>
          )}

          <div className="tm-prose" dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        {post.tags.length > 0 && (
          <div className="mt-8 border-t border-dashed border-tm-border pt-4">
            <span className="mr-2.5 text-[11px] text-tm-muted">{t("blog.post.tagsLabel")}</span>
            {post.tags.map((tg) => (
              <Link
                key={tg.slug}
                to="/tags/$slug"
                params={{ slug: tg.slug }}
                className="mr-2.5 text-[11.5px] text-tm-accent no-underline"
              >
                #{tg.name}
              </Link>
            ))}
          </div>
        )}

        {(adjacent.prev || adjacent.next) && (
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-dashed border-tm-border pt-4 text-[11.5px]">
            <div>
              {adjacent.prev && (
                <Link
                  to="/posts/$slug"
                  params={{ slug: adjacent.prev.slug }}
                  className="text-tm-fg no-underline"
                >
                  <span className="block text-[11px] text-tm-muted">{t("blog.post.older")}</span>
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
                  <span className="block text-[11px] text-tm-muted">{t("blog.post.newer")}</span>
                  <span className="text-tm-accent">{adjacent.next.title}</span>
                </Link>
              )}
            </div>
          </div>
        )}

        <Comments config={giscus} />

        <AsciiRule className="mt-10 mb-3" />
        <p className="text-xs leading-[1.7] text-tm-muted">
          <Link to="/posts" className="text-tm-accent no-underline">
            $ cd ..
          </Link>
          {t("blog.post.back")}
        </p>
      </TmPage>
    </>
  );
}
