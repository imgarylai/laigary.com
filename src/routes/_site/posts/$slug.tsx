import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { postDataFn } from "@/server/public";
import { AsciiRule, PromptLine, ReadingProgress } from "@/components/terminal/ui";
import { useI18n } from "@/i18n/I18nProvider";
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
  const { t } = useI18n();

  return (
    <>
      <ReadingProgress />
      <article className="tm-page--narrow">
        <Link to="/posts" className="tm-back">
          $ cd ..
        </Link>

        <PromptLine className="tm-prompt--tight">
          {FS_BLOG.post.prompt({ slug: post.slug })}
        </PromptLine>
        <pre className="tm-frontmatter">
          {`---\ntitle:   "${post.title}"\ndate:    ${post.date.slice(0, 10)}\nreading: ${post.readingTime} min\ntags:    [${post.tags.map((t) => t.name).join(", ")}]\n---`}
        </pre>

        <h1 className="tm-title">{post.title}</h1>
        <AsciiRule className="tm-rule--head" />

        {toc.length > 0 && (
          <div className="tm-toc">
            <div className="tm-toc__head">{t("blog.post.toc")}</div>
            {toc.map((h, i) => (
              <div key={i} className="tm-toc__row">
                <span className="tm-toc__num">{String(i + 1).padStart(2, "0")}</span>
                {h}
              </div>
            ))}
          </div>
        )}

        <div className="tm-prose" dangerouslySetInnerHTML={{ __html: html }} />

        {post.tags.length > 0 && (
          <div className="tm-tags">
            <span className="tm-tags__label">{t("blog.post.tagsLabel")}</span>
            {post.tags.map((t) => (
              <Link key={t.slug} to="/posts" search={{ tag: t.slug }} className="tm-tag">
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        <AsciiRule className="tm-rule--foot" />
        <p className="tm-cta">
          <Link to="/posts" className="tm-cta__link">
            $ cd ..
          </Link>
          {t("blog.post.back")}
        </p>
      </article>
    </>
  );
}
