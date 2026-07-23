import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { tagDataFn } from "@/server/public";
import { SITE_ORIGIN, breadcrumbLd, serializeJsonLd } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { PromptLine } from "@/components/terminal/ui";
import { TmPage, TmRowLink, TmRowCells } from "@/components/terminal/layout";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";

// Crawlable topic page for one tag — the URL the sitemap advertises. The
// archive keeps its `?tag=` filter for old links; internal tag chips point
// here.
export const Route = createFileRoute("/_site/tags/$slug")({
  loader: async ({ params }) => {
    const data = await tagDataFn({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: `#${loaderData.tag.name}`,
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/tags/${loaderData.tag.slug}`,
            image: `${SITE_ORIGIN}/api/og`,
            type: "website",
          }),
        ]
      : [],
    links: loaderData ? canonicalLink(`${SITE_ORIGIN}/tags/${loaderData.tag.slug}`) : [],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: serializeJsonLd(
              breadcrumbLd([
                { name: "~", path: "/" },
                { name: "tags", path: "/tags" },
                { name: `#${loaderData.tag.name}` },
              ]),
            ),
          },
        ]
      : [],
  }),
  component: TagPage,
});

function TagPage() {
  const { tag, posts } = Route.useLoaderData();
  const { t } = useI18n();

  const byYear = new Map<string, typeof posts>();
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    (byYear.get(y) ?? byYear.set(y, []).get(y)!).push(p);
  }
  const years = [...byYear.keys()].sort().reverse();

  return (
    <TmPage>
      <PromptLine>{FS_BLOG.tag.prompt({ slug: tag.slug })}</PromptLine>

      <div className="mb-5 flex items-baseline gap-3">
        <h1 className="m-0 text-lg">
          <span className="text-tm-accent">#</span>
          {tag.name}
        </h1>
        <span className="text-[11px] text-tm-muted">
          {posts.length} {t("blog.tags.postsUnit")}
        </span>
      </div>

      {years.map((y) => (
        <section key={y}>
          <pre className="mt-7 mb-1.5 text-xs text-tm-accent">./{y}/</pre>
          {byYear.get(y)!.map((p) => (
            <TmRowLink key={p.slug} to="/posts/$slug" params={{ slug: p.slug }}>
              <TmRowCells date={p.date.slice(5, 10)} title={p.title} read={`${p.readingTime}m`} />
            </TmRowLink>
          ))}
        </section>
      ))}

      <p className="mt-8 text-xs leading-[1.7] text-tm-muted">
        <Link to="/tags" className="text-tm-accent no-underline">
          $ cd ..
        </Link>
        {t("blog.tags.back")}
      </p>
    </TmPage>
  );
}
