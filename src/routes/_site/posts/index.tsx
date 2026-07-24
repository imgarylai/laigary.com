import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { postsDataFn } from "@/server/public";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { PromptLine, TmPage, TmEmpty, TmRowLink, TmRowCells, TmPager } from "@/features/terminal";
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
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: "Posts",
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/posts`,
            image: `${SITE_ORIGIN}/api/og`,
            type: "website",
          }),
        ]
      : [],
    links: canonicalLink(`${SITE_ORIGIN}/posts`),
  }),
  component: Archive,
});

function Archive() {
  const { posts } = Route.useLoaderData();
  const { tag, page } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();

  // Pinned posts render in their own block above the years; keep them out of
  // the chronological list unless a tag filter is active (then they compete on
  // tags like any other post). Mirrors the interview section listing.
  const pinnedPosts = posts.filter((p) => p.pinned);
  const filtered = tag
    ? posts.filter((p) => p.tags.some((pt) => pt.slug === tag))
    : posts.filter((p) => !p.pinned);
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
        <div className="mb-5 flex items-center gap-2 text-xs text-tm-muted">
          <span>
            {t("blog.archive.filteredBy")} <span className="text-tm-accent">#{tag}</span>
          </span>
          <Link
            to="/posts"
            className="border border-tm-border px-2 py-0.5 text-xs text-tm-muted no-underline"
          >
            {t("blog.archive.clear")}
          </Link>
        </div>
      )}

      {/* Pinned block (design: same `./{dir}/` accent header as the year
          sections) — page 1 of the unfiltered list only, so pagination and
          tag filtering stay untouched. */}
      {!tag && safePage === 1 && pinnedPosts.length > 0 && (
        <section>
          <pre className="mt-7 mb-1.5 text-sm text-tm-accent">./pinned/</pre>
          {pinnedPosts.map((p) => (
            <TmRowLink key={p.slug} to="/posts/$slug" params={{ slug: p.slug }}>
              <TmRowCells date="*" title={p.title} read={`${p.readingTime}m`} />
            </TmRowLink>
          ))}
        </section>
      )}

      {years.map((y) => (
        <section key={y}>
          <pre className="mt-7 mb-1.5 text-sm text-tm-accent">./{y}/</pre>
          {byYear.get(y)!.map((p) => (
            <TmRowLink key={p.slug} to="/posts/$slug" params={{ slug: p.slug }}>
              <TmRowCells date={p.date.slice(5, 10)} title={p.title} read={`${p.readingTime}m`} />
            </TmRowLink>
          ))}
        </section>
      ))}

      {filtered.length === 0 && <TmEmpty>{t("blog.archive.noMatch")}</TmEmpty>}

      <TmPager
        current={safePage}
        totalPages={totalPages}
        from={start + 1}
        to={start + pageItems.length}
        total={filtered.length}
        onPage={goPage}
      />
    </TmPage>
  );
}
