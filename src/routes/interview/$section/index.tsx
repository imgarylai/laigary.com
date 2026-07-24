import { createFileRoute, notFound, useNavigate, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { sectionDataFn } from "@/server/public";
import {
  AsciiRule,
  PromptLine,
  TmPage,
  TmEmpty,
  TmRowLink,
  TmRowCells,
  TmPager,
} from "@/features/terminal";
import { SITE_ORIGIN } from "@/lib/json-ld";
import { canonicalLink, ogMeta } from "@/lib/og-meta";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_INTERVIEW } from "@/lib/fsmap";

const PAGE_SIZE = 20;

type SectionSearch = { page?: number; tag?: string };

export const Route = createFileRoute("/interview/$section/")({
  validateSearch: (search: Record<string, unknown>): SectionSearch => ({
    page: Number(search.page) > 1 ? Math.floor(Number(search.page)) : undefined,
    tag: typeof search.tag === "string" && search.tag ? search.tag : undefined,
  }),
  loader: async ({ params }) => {
    const data = await sectionDataFn({ data: { slug: params.section } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.pageTitle },
          ...ogMeta({
            title: loaderData.section.label,
            siteName: loaderData.siteName,
            url: `${SITE_ORIGIN}/interview/${loaderData.section.slug}`,
            image: `${SITE_ORIGIN}/api/og`,
            type: "website",
          }),
        ]
      : [],
    links: loaderData ? canonicalLink(`${SITE_ORIGIN}/interview/${loaderData.section.slug}`) : [],
  }),
  component: SectionPage,
});

function SectionPage() {
  const { section, notes, tags } = Route.useLoaderData();
  const { page, tag } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();

  // Note tags carry names (no separate slug is surfaced), so filter by name.
  const filtered = tag ? notes.filter((n) => n.tags.includes(tag)) : notes;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page ?? 1, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  // Year sections over the current page, same shape as the posts archive
  // (design: Blog.html TmArchive — `./{year}/` accent headers).
  const byYear = new Map<string, typeof pageItems>();
  for (const n of pageItems) {
    const y = n.date.slice(0, 4);
    (byYear.get(y) ?? byYear.set(y, []).get(y)!).push(n);
  }
  const years = [...byYear.keys()].sort().reverse();

  const goPage = (n: number) => {
    navigate({
      to: "/interview/$section",
      params: { section: section.slug },
      search: { page: n > 1 ? n : undefined, tag },
    });
    window.scrollTo({ top: 0 });
  };

  return (
    <TmPage>
      <PromptLine className="mb-1.5">
        {FS_INTERVIEW.section.prompt({ sect: section.slug })}
        {totalPages > 1 ? ` | sed -n '${start + 1},${start + pageItems.length}p'` : ""}
      </PromptLine>
      <h1 className="mb-1.5 text-[calc(1.25rem*var(--tm-fs))]">{section.label}</h1>
      {section.blurb && (
        <p className="mb-2 text-[calc(0.9062rem*var(--tm-fs))] leading-[1.7] text-tm-muted">
          {section.blurb}
        </p>
      )}
      <AsciiRule className="mt-2 mb-5" />

      {/* Tag filter chips (design: interview/app.jsx `--filter` row). Chips
          carry tag names — the same value note rows and detail links filter
          by — with `all` clearing the filter. */}
      {tags.length > 0 && (
        <div className="mb-[22px] flex flex-wrap items-baseline gap-1.5">
          <span className="mr-1.5 text-[calc(0.8125rem*var(--tm-fs))] text-tm-muted">--filter</span>
          <Link
            to="/interview/$section"
            params={{ section: section.slug }}
            className={cn(
              "border px-2.5 py-[3px] text-[calc(0.8125rem*var(--tm-fs))] no-underline",
              tag
                ? "border-tm-border text-tm-muted"
                : "border-tm-accent bg-tm-subtle text-tm-accent",
            )}
          >
            all
          </Link>
          {tags.map((name) => (
            <Link
              key={name}
              to="/interview/$section"
              params={{ section: section.slug }}
              search={{ tag: name }}
              className={cn(
                "border px-2.5 py-[3px] text-[calc(0.8125rem*var(--tm-fs))] no-underline",
                tag === name
                  ? "border-tm-accent bg-tm-subtle text-tm-accent"
                  : "border-tm-border text-tm-muted",
              )}
            >
              #{name}
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <TmEmpty>{t("blog.interview.noneYet")}</TmEmpty>
      ) : (
        years.map((y) => (
          <section key={y}>
            <pre className="mt-7 mb-1.5 text-[calc(0.875rem*var(--tm-fs))] text-tm-accent">
              ./{y}/
            </pre>
            {byYear.get(y)!.map((n) => (
              <TmRowLink
                key={n.slug}
                to="/interview/$section/$slug"
                params={{ section: section.slug, slug: n.slug }}
              >
                <TmRowCells date={n.date.slice(5)} title={n.title} read={`${n.minutes}m`} />
              </TmRowLink>
            ))}
          </section>
        ))
      )}

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
