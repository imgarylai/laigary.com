import { ArticleHeader } from "@/features/public-site/ArticleHeader";
import { Comments } from "@/components/Comments";
import { ArticleBody } from "@/features/public-site/ArticleBody";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { noteDataFn } from "@/server/public";
import { SITE_ORIGIN, breadcrumbLd, serializeJsonLd, techArticleLd } from "@/lib/json-ld";
import { canonicalLink, markdownAlternateLink, ogMeta } from "@/lib/og-meta";
import { AsciiRule, ReadingProgress, TmPage, Toc } from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/interview/$section/$slug")({
  loader: async ({ params }) => {
    const data = await noteDataFn({ data: { section: params.section, slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: loaderData.note.title,
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/interview/${loaderData.note.section}/${loaderData.note.slug}`,
            image: `${SITE_ORIGIN}/api/og/interview/${loaderData.note.section}/${loaderData.note.slug}`,
            type: "article",
            publishedTime: loaderData.note.date,
            modifiedTime: loaderData.note.updatedAt,
          }),
        ]
      : [],
    links: loaderData
      ? [
          ...canonicalLink(
            `${SITE_ORIGIN}/interview/${loaderData.note.section}/${loaderData.note.slug}`,
          ),
          ...markdownAlternateLink(
            `${SITE_ORIGIN}/interview/${loaderData.note.section}/${loaderData.note.slug}`,
          ),
        ]
      : [],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: serializeJsonLd(
              techArticleLd({
                ...loaderData.note,
                tags: loaderData.note.tags.map((tg) => tg.name),
              }),
            ),
          },
          {
            type: "application/ld+json",
            children: serializeJsonLd(
              breadcrumbLd([
                { name: "interview", path: "/interview" },
                {
                  name: loaderData.note.sectionLabel,
                  path: `/interview/${loaderData.note.section}`,
                },
                { name: loaderData.note.title },
              ]),
            ),
          },
        ]
      : [],
  }),
  component: NotePage,
});

function NotePage() {
  const { note, html, toc, giscus } = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <div className="public-reading-layout">
      <ReadingProgress />
      <Toc entries={toc} />
      <TmPage narrow>
        {/* lang: content region is zh-Hant; <html lang> follows the UI locale. */}
        <article lang="zh-Hant">
          <ArticleHeader
            title={note.title}
            date={note.date}
            minutes={note.minutes}
            section={note.sectionLabel}
          />
          <AsciiRule className="mb-8" />

          <ArticleBody html={html} title={note.title} />
        </article>

        {note.tags.length > 0 && (
          <div className="mt-8 border-t border-dashed border-tm-border pt-4">
            <span className="mr-2.5 text-xs text-tm-muted">{t("blog.post.tagsLabel")}</span>
            {note.tags.map((tag) => (
              <Link
                key={tag.slug}
                to="/tags/$slug"
                params={{ slug: tag.slug }}
                className="mr-2.5 text-xs text-tm-accent no-underline"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        <Comments config={giscus} />

        <div className="mt-8 flex gap-3.5">
          <Link
            to="/interview/$section"
            params={{ section: note.section }}
            className="text-sm text-tm-muted no-underline"
          >
            ← {note.sectionLabel}
          </Link>
          <Link to="/interview" className="text-sm text-tm-muted no-underline">
            {t("public.notes")}
          </Link>
        </div>
      </TmPage>
    </div>
  );
}
