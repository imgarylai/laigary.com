import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageDataFn } from "@/server/public";
import { PromptLine } from "@/components/terminal/ui";
import { TmPage } from "@/components/terminal/layout";
import { FS_BLOG } from "@/lib/fsmap";

// Catch-all for DB-backed content pages (e.g. /about, /now). Matches last, so
// concrete routes like /posts and /tags take precedence.
export const Route = createFileRoute("/_site/$slug")({
  loader: async ({ params }) => {
    const data = await pageDataFn({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  component: PagePage,
});

function PagePage() {
  const { page, html } = Route.useLoaderData();

  return (
    <TmPage narrow>
      <PromptLine className="mb-4">{FS_BLOG.page.prompt({ slug: page.slug })}</PromptLine>
      <h1 className="mb-[18px] text-[20px] font-bold leading-[1.35]">{page.title}</h1>
      <div className="tm-prose" dangerouslySetInnerHTML={{ __html: html }} />
    </TmPage>
  );
}
