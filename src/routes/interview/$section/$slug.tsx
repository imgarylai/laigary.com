import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { noteDataFn } from "@/server/public";
import { AsciiRule, PromptLine, ReadingProgress } from "@/components/terminal/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { FS_INTERVIEW } from "@/lib/fsmap";

export const Route = createFileRoute("/interview/$section/$slug")({
  loader: async ({ params }) => {
    const data = await noteDataFn({ data: { section: params.section, slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  component: NotePage,
});

function NotePage() {
  const { note, html } = Route.useLoaderData();
  const { t } = useI18n();

  return (
    <>
      <ReadingProgress />
      <article className="tm-page--narrow">
        <PromptLine className="tm-prompt--tight">
          {FS_INTERVIEW.note.prompt({ sect: note.section, slug: note.slug })}
        </PromptLine>
        <div className="tm-noterow">
          <span className="tm-noterow__label">[{note.sectionLabel}]</span>
          <span className="tm-noterow__dot">·</span>
          <span className="tm-noterow__meta">{note.date}</span>
          <span className="tm-noterow__dot">·</span>
          <span className="tm-noterow__meta">
            {t("blog.interview.minRead", { min: String(note.minutes) })}
          </span>
        </div>

        <h1 className="tm-title tm-title--sm">{note.title}</h1>
        <AsciiRule className="tm-rule--head" />

        <div className="tm-prose" dangerouslySetInnerHTML={{ __html: html }} />

        {note.tags.length > 0 && (
          <div className="tm-tags">
            <span className="tm-tags__label">{t("blog.post.tagsLabel")}</span>
            {note.tags.map((tag) => (
              <span key={tag} className="tm-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="tm-note-footer">
          <Link
            to="/interview/$section"
            params={{ section: note.section }}
            className="tm-cta__link"
          >
            ← cd ../{note.section}
          </Link>
          <Link to="/interview" className="tm-cta__link">
            cd ~
          </Link>
        </div>
      </article>
    </>
  );
}
