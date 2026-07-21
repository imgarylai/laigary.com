import { createFileRoute, notFound } from "@tanstack/react-router";
import { sectionDataFn } from "@/server/public";
import { AsciiRule, PromptLine } from "@/components/terminal/ui";
import { TmPage, TmEmpty, TmRowLink, TmRowCells } from "@/components/terminal/layout";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_INTERVIEW } from "@/lib/fsmap";

export const Route = createFileRoute("/interview/$section/")({
  loader: async ({ params }) => {
    const data = await sectionDataFn({ data: { slug: params.section } });
    if (!data) throw notFound();
    return data;
  },
  component: SectionPage,
});

function SectionPage() {
  const { section, notes } = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <TmPage>
      <PromptLine className="mb-1.5">
        {FS_INTERVIEW.section.prompt({ sect: section.slug })}
      </PromptLine>
      <h1 className="mb-1.5 text-lg">{section.label}</h1>
      {section.blurb && (
        <p className="mb-2 text-[12.5px] leading-[1.7] text-tm-muted">{section.blurb}</p>
      )}
      <AsciiRule className="mt-2 mb-5" />

      {notes.length === 0 ? (
        <TmEmpty>{t("blog.interview.noneYet")}</TmEmpty>
      ) : (
        <div className="flex flex-col">
          {notes.map((n) => (
            <TmRowLink
              key={n.slug}
              to="/interview/$section/$slug"
              params={{ section: section.slug, slug: n.slug }}
            >
              <TmRowCells date={n.date.slice(5)} title={n.title} read={`${n.minutes}m`} />
            </TmRowLink>
          ))}
        </div>
      )}
    </TmPage>
  );
}
