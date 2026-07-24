import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageDataFn } from "@/server/public";
import { SITE_ORIGIN, breadcrumbLd, serializeJsonLd, webPageLd } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { Prose, PromptLine, TmPage } from "@/features/terminal";
import { FS_BLOG } from "@/lib/fsmap";

// Catch-all for DB-backed content pages (e.g. /about, /now). Matches last, so
// concrete routes like /posts and /tags take precedence.
export const Route = createFileRoute("/_site/$slug")({
  loader: async ({ params }) => {
    const data = await pageDataFn({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: loaderData.page.title,
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/${loaderData.page.slug}`,
            image: `${SITE_ORIGIN}/api/og/pages/${loaderData.page.slug}`,
            type: "website",
            description: loaderData.description || undefined,
          }),
        ]
      : [],
    links: loaderData ? canonicalLink(`${SITE_ORIGIN}/${loaderData.page.slug}`) : [],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: serializeJsonLd(webPageLd(loaderData.page)),
          },
          {
            type: "application/ld+json",
            children: serializeJsonLd(
              breadcrumbLd([{ name: "~", path: "/" }, { name: loaderData.page.title }]),
            ),
          },
        ]
      : [],
  }),
  component: PagePage,
});

function PagePage() {
  const { page, html } = Route.useLoaderData();

  return (
    <TmPage narrow>
      <PromptLine className="mb-4">{FS_BLOG.page.prompt({ slug: page.slug })}</PromptLine>
      {/* lang: content region is zh-Hant; <html lang> follows the UI locale. */}
      <article lang="zh-Hant">
        <h1 className="mb-[18px] text-[20px] font-bold leading-[1.35]">{page.title}</h1>
        <Prose html={html} />
      </article>
    </TmPage>
  );
}
