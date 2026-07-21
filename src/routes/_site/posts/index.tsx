import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { postsDataFn } from "@/server/public";
import { Button } from "@/components/ui/button";
import { AsciiRule, PromptLine } from "@/components/terminal/ui";
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

  const filtered = tag ? posts.filter((p) => p.tags.some((t) => t.slug === tag)) : posts;
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
    <div className="tm-page">
      <PromptLine>
        {FS_BLOG.archive.prompt()}
        {totalPages > 1 ? ` | sed -n '${start + 1},${start + pageItems.length}p'` : ""}
      </PromptLine>

      {tag && (
        <div className="tm-filter">
          <span>
            filtered by <span className="tm-filter__tag">#{tag}</span>
          </span>
          <Link to="/posts" className="tm-clear">
            clear ✕
          </Link>
        </div>
      )}

      {years.map((y) => (
        <section key={y}>
          <pre className="tm-year">./{y}/</pre>
          {byYear.get(y)!.map((p) => (
            <Link
              key={p.slug}
              to="/posts/$slug"
              params={{ slug: p.slug }}
              className="tm-archive-row"
            >
              <span className="tm-archive-row__date">{p.date.slice(5, 10)}</span>
              <span>{p.title}</span>
              <span className="tm-archive-row__read">{p.readingTime}m</span>
            </Link>
          ))}
        </section>
      ))}

      {filtered.length === 0 && <div className="tm-empty">// no posts match.</div>}

      {totalPages > 1 && (
        <div className="tm-pager">
          <AsciiRule className="tm-prompt--pad" />
          <div className="tm-pager__bar">
            <span className="tm-pager__status">
              page {safePage}/{totalPages}
              <span className="tm-pager__status-dim">
                {" "}
                · showing {start + 1}–{start + pageItems.length} of {filtered.length}
              </span>
            </span>
            <div className="tm-pager__group">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="tm-btn"
                disabled={safePage === 1}
                onClick={() => goPage(safePage - 1)}
              >
                ← newer
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={
                    n === safePage ? "tm-pager__num tm-pager__num--active" : "tm-pager__num"
                  }
                  onClick={() => goPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="tm-btn"
                disabled={safePage === totalPages}
                onClick={() => goPage(safePage + 1)}
              >
                older →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
