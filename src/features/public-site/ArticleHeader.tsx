import { useI18n } from "@/i18n/I18nProvider";
import { formatReadingTime } from "@/lib/reading-time";

export function ArticleHeader({
  title,
  date,
  minutes,
  section,
}: {
  title: string;
  date: string;
  minutes: number;
  section?: string;
}) {
  const { t } = useI18n();
  return (
    <header className="public-article-header">
      <h1>{title}</h1>
      <p className="mb-8 flex flex-wrap gap-x-2 text-sm text-tm-muted">
        {section && (
          <>
            <span className="text-tm-accent">{section}</span>
            <span aria-hidden>·</span>
          </>
        )}
        <time dateTime={date}>{date.slice(0, 10)}</time>
        <span aria-hidden>·</span>
        <span>{formatReadingTime(minutes, t)}</span>
      </p>
    </header>
  );
}
