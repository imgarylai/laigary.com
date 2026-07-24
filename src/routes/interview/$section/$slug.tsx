import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { noteDataFn } from "@/server/public";
import { SITE_ORIGIN, breadcrumbLd, serializeJsonLd, techArticleLd } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { AsciiRule, Prose, PromptLine, ReadingProgress, TmPage } from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_INTERVIEW } from "@/lib/fsmap";

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
      ? canonicalLink(`${SITE_ORIGIN}/interview/${loaderData.note.section}/${loaderData.note.slug}`)
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
  const { note, html } = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <>
      <ReadingProgress />
      <TmPage narrow>
        <PromptLine className="mb-1.5">
          {FS_INTERVIEW.note.prompt({ sect: note.section, slug: note.slug })}
        </PromptLine>
        <div className="mb-1.5 flex flex-wrap items-baseline gap-2 text-xs">
          <span className="text-tm-accent">[{note.sectionLabel}]</span>
          <span className="text-tm-dim">·</span>
          <span className="text-tm-muted">{note.date}</span>
          <span className="text-tm-dim">·</span>
          <span className="text-tm-muted">
            {t("blog.interview.minRead", { min: String(note.minutes) })}
          </span>
        </div>

        {/* lang: content region is zh-Hant; <html lang> follows the UI locale. */}
        <article lang="zh-Hant">
          <h1 className="mt-2 mb-1 text-2xl font-semibold leading-[1.35]">{note.title}</h1>
          <AsciiRule className="mb-5" />

          <Prose html={html} />
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

        <div className="mt-8 flex gap-3.5">
          <Link
            to="/interview/$section"
            params={{ section: note.section }}
            className="text-sm text-tm-muted no-underline"
          >
            ← cd ../{note.section}
          </Link>
          <Link to="/interview" className="text-sm text-tm-muted no-underline">
            cd ~
          </Link>
        </div>
      </TmPage>
    </>
  );
}
