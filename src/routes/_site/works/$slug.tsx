import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { workDataFn } from "@/server/public";
import { SITE_ORIGIN, breadcrumbLd, creativeWorkLd, serializeJsonLd } from "@/lib/json-ld";
import { canonicalLink, markdownAlternateLink, ogMeta } from "@/lib/og-meta";
import { AsciiRule, Prose, PromptLine, TmPage } from "@/features/terminal";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";
import { fmtYearRange } from "@/lib/date";

export const Route = createFileRoute("/_site/works/$slug")({
  loader: async ({ params }) => {
    const data = await workDataFn({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: loaderData.work.title,
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/works/${loaderData.work.slug}`,
            image:
              loaderData.work.coverImageUrl ??
              `${SITE_ORIGIN}/api/og/works/${loaderData.work.slug}`,
            type: "article",
            description: loaderData.description || undefined,
            publishedTime: loaderData.work.date,
            modifiedTime: loaderData.work.updatedAt,
          }),
        ]
      : [],
    links: loaderData
      ? [
          ...canonicalLink(`${SITE_ORIGIN}/works/${loaderData.work.slug}`),
          ...markdownAlternateLink(`${SITE_ORIGIN}/works/${loaderData.work.slug}`),
        ]
      : [],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: serializeJsonLd(
              creativeWorkLd({
                ...loaderData.work,
                tags: loaderData.work.tags.map((tag) => tag.name),
              }),
            ),
          },
          {
            type: "application/ld+json",
            children: serializeJsonLd(
              breadcrumbLd([
                { name: "~", path: "/" },
                { name: "works", path: "/works" },
                { name: loaderData.work.title },
              ]),
            ),
          },
        ]
      : [],
  }),
  component: WorkPage,
});

/**
 * The `---` block above the heading, in the same shape the post page uses.
 * Every line whose value is absent is dropped rather than printed empty — a
 * work with no repo should not advertise a blank `repo:`.
 *
 * Stays plain text, including `stack:`. Frontmatter is a literal transcript of
 * the file's own header; the clickable version of the stack is the `--stack`
 * row below the article, exactly as the post page splits `tags:` from its
 * `--tags` row.
 */
function frontmatter(work: {
  title: string;
  year: number;
  endYear: number | null;
  role: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  tags: { name: string }[];
}): string {
  const lines = [
    `title:  "${work.title}"`,
    `year:   ${fmtYearRange(work.year, work.endYear)}`,
    ...(work.role ? [`role:   ${work.role}`] : []),
    ...(work.tags.length > 0 ? [`stack:  [${work.tags.map((t) => t.name).join(", ")}]`] : []),
    ...(work.projectUrl ? [`live:   ${work.projectUrl}`] : []),
    ...(work.repoUrl ? [`repo:   ${work.repoUrl}`] : []),
  ];
  return `---\n${lines.join("\n")}\n---`;
}

function WorkPage() {
  const { work, html } = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <TmPage narrow>
      <Link to="/works" className="mb-4 inline-block text-sm text-tm-accent no-underline">
        $ cd ..
      </Link>

      <PromptLine className="mb-1.5">{FS_BLOG.work.prompt({ slug: work.slug })}</PromptLine>
      <pre className="m-0 mb-2 text-xs text-tm-muted">{frontmatter(work)}</pre>

      {/* lang: content is written in Traditional Chinese while <html lang>
          follows the UI locale — mark the content region so the language
          signals agree with the JSON-LD inLanguage declaration. */}
      <article lang="zh-Hant">
        <h1 className="mt-5 mb-2.5 text-2xl font-bold leading-snug">{work.title}</h1>
        <AsciiRule className="mb-5" />

        {/* A work can ship as a link and a summary with no case study written
            for it, so the body is conditional where a post's never is. */}
        {html ? <Prose html={html} /> : <p className="text-sm text-tm-fg">{work.summary}</p>}
      </article>

      {work.tags.length > 0 && (
        <div className="mt-8 border-t border-dashed border-tm-border pt-4">
          <span className="mr-2.5 text-xs text-tm-muted">{t("blog.works.stackLabel")}</span>
          {work.tags.map((tg) => (
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

      {(work.projectUrl || work.repoUrl) && (
        <div className="mt-8 flex flex-col gap-1.5 border-t border-dashed border-tm-border pt-4">
          {work.projectUrl && (
            <a
              href={work.projectUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-tm-accent no-underline"
            >
              $ open {work.projectUrl}
            </a>
          )}
          {work.repoUrl && (
            <a
              href={work.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-tm-accent no-underline"
            >
              $ git clone {work.repoUrl}
            </a>
          )}
        </div>
      )}

      <AsciiRule className="mt-10 mb-3" />
      <p className="text-sm leading-relaxed text-tm-muted">
        <Link to="/works" className="text-tm-accent no-underline">
          $ cd ..
        </Link>
        {t("blog.works.back")}
      </p>
    </TmPage>
  );
}
