import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { sectionDataFn } from "@/server/public";
import { AsciiRule, PromptLine } from "@/components/terminal/ui";
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
    <div className="tm-page">
      <PromptLine className="tm-prompt--tight">
        {FS_INTERVIEW.section.prompt({ sect: section.slug })}
      </PromptLine>
      <h1 className="tm-section__title">{section.label}</h1>
      {section.blurb && <p className="tm-section__lead">{section.blurb}</p>}
      <AsciiRule className="tm-rule--sep" />

      {notes.length === 0 ? (
        <div className="tm-empty">{t("blog.interview.noneYet")}</div>
      ) : (
        <div className="tm-rows">
          {notes.map((n) => (
            <Link
              key={n.slug}
              to="/interview/$section/$slug"
              params={{ section: section.slug, slug: n.slug }}
              className="tm-archive-row"
            >
              <span className="tm-archive-row__date">{n.date.slice(5)}</span>
              <span>{n.title}</span>
              <span className="tm-archive-row__read">{n.minutes}m</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
