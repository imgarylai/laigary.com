import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { postsDataFn } from "@/server/public";
import { Button } from "@/components/ui/button";
import { AsciiRule, PromptLine } from "@/components/terminal/ui";
import { TmPage, TmEmpty, TmRowLink, TmRowCells } from "@/components/terminal/layout";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_BLOG } from "@/lib/fsmap";

const PAGE_SIZE = 8;

type ArchiveSearch = { tag?: string; page?: number };

export const Route = createFileRoute("/_site/posts/")({
  validateSearch: (search: Record<string, unknown>): ArchiveSearch => ({
    tag: typeof search.tag === "string" && search.tag ? search.tag : undefined,
    page: Number(search.page) > 1 ? Math.floor(Number(search.page)) : undefined,
  }),
  loader: () => postsDataFn(),
  component: Archive,
});

function Archive() {
  const posts = Route.useLoaderData();
  const { tag, page } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();

  const filtered = tag ? posts.filter((p) => p.tags.some((pt) => pt.slug === tag)) : posts;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page ?? 1, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const byYear = new Map<string, typeof pageItems>();
  for (const p of pageItems) {
    const y = p.date.slice(0, 4);
    (byYear.get(y) ?? byYear.set(y, []).get(y)!).push(p);
  }
  const years = [...byYear.keys()].sort().reverse();

  const goPage = (n: number) => {
    navigate({ to: "/posts", search: { tag, page: n > 1 ? n : undefined } });
    window.scrollTo({ top: 0 });
  };

  return (
    <TmPage>
      <PromptLine>
        {FS_BLOG.archive.prompt()}
        {totalPages > 1 ? ` | sed -n '${start + 1},${start + pageItems.length}p'` : ""}
      </PromptLine>

      {tag && (
        <div className="mb-5 flex items-center gap-2 text-[11.5px] text-tm-muted">
          <span>
            {t("blog.archive.filteredBy")} <span className="text-tm-accent">#{tag}</span>
          </span>
          <Link
            to="/posts"
            className="border border-tm-border px-[7px] py-0.5 text-[10.5px] text-tm-muted no-underline"
          >
            {t("blog.archive.clear")}
          </Link>
        </div>
      )}

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

      {filtered.length === 0 && <TmEmpty>{t("blog.archive.noMatch")}</TmEmpty>}

      {totalPages > 1 && (
        <div className="mt-9">
          <AsciiRule className="mb-4" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-tm-muted">
              {t("blog.archive.page", { current: String(safePage), total: String(totalPages) })}
              <span className="text-tm-dim">
                {t("blog.archive.showing", {
                  from: String(start + 1),
                  to: String(start + pageItems.length),
                  total: String(filtered.length),
                })}
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="tm-btn"
                disabled={safePage === 1}
                onClick={() => goPage(safePage - 1)}
              >
                {t("blog.archive.newer")}
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goPage(n)}
                  className={cn(
                    "min-w-[26px] cursor-pointer border border-transparent px-2 py-[3px] text-xs",
                    n === safePage ? "border-tm-accent text-tm-accent" : "text-tm-muted",
                  )}
                >
                  {n}
                </button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="tm-btn"
                disabled={safePage === totalPages}
                onClick={() => goPage(safePage + 1)}
              >
                {t("blog.archive.older")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </TmPage>
  );
}
