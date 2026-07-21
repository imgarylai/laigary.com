import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { postsDataFn } from "@/server/public";
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
        <div
          style={{
            marginBottom: 20,
            fontSize: 11.5,
            color: "var(--tm-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>
            filtered by <span style={{ color: "var(--tm-accent)" }}>#{tag}</span>
          </span>
          <Link
            to="/posts"
            style={{
              border: "1px solid var(--tm-border)",
              color: "var(--tm-muted)",
              fontSize: 10.5,
              padding: "2px 7px",
              textDecoration: "none",
            }}
          >
            clear ✕
          </Link>
        </div>
      )}

      {years.map((y) => (
        <section key={y} style={{ marginTop: 28 }}>
          <pre style={{ color: "var(--tm-accent)", fontSize: 12, margin: "0 0 6px" }}>./{y}/</pre>
          {byYear.get(y)!.map((p) => (
            <Link
              key={p.slug}
              to="/posts/$slug"
              params={{ slug: p.slug }}
              className="tm-archive-row"
              style={{
                width: "100%",
                borderBottom: "1px dashed var(--tm-border)",
                padding: "7px 8px",
                color: "var(--tm-fg)",
                fontSize: 12.5,
                textDecoration: "none",
              }}
            >
              <span style={{ color: "var(--tm-muted)" }}>{p.date.slice(5, 10)}</span>
              <span>{p.title}</span>
              <span style={{ color: "var(--tm-dim)", textAlign: "right", fontSize: 11 }}>
                {p.readingTime}m
              </span>
            </Link>
          ))}
        </section>
      ))}

      {filtered.length === 0 && (
        <div style={{ color: "var(--tm-muted)", fontSize: 12, padding: "24px 0" }}>
          // no posts match.
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: 36 }}>
          <AsciiRule style={{ margin: "0 0 10px" }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "var(--tm-muted)", fontSize: 11 }}>
              page {safePage}/{totalPages}
              <span style={{ color: "var(--tm-dim)" }}>
                {" "}
                · showing {start + 1}–{start + pageItems.length} of {filtered.length}
              </span>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <PagerBtn disabled={safePage === 1} onClick={() => goPage(safePage - 1)}>
                ← newer
              </PagerBtn>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goPage(n)}
                  style={{
                    background: "transparent",
                    border: `1px solid ${n === safePage ? "var(--tm-accent)" : "transparent"}`,
                    color: n === safePage ? "var(--tm-accent)" : "var(--tm-muted)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 12,
                    padding: "3px 8px",
                    minWidth: 26,
                  }}
                >
                  {n}
                </button>
              ))}
              <PagerBtn disabled={safePage === totalPages} onClick={() => goPage(safePage + 1)}>
                older →
              </PagerBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PagerBtn({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: "transparent",
        border: "1px solid var(--tm-border)",
        color: disabled ? "var(--tm-dim)" : "var(--tm-fg)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: "inherit",
        fontSize: 11.5,
        padding: "4px 10px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
