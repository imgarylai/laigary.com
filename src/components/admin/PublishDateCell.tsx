import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/I18nProvider";
import { useMounted } from "@/hooks/use-mounted";

/**
 * The publish date in the post and note lists — the column both are now
 * ordered by.
 *
 * Three states, because a nullable date on a row that also carries a status is
 * genuinely three things: no date (a draft nobody has dated), a date that has
 * passed (live), and a date that has not (scheduled). Only the third needs
 * saying out loud — the status badge beside it reads "published" for a post
 * nobody can read yet, and without the marker that looks like a bug.
 *
 * Formatting waits for mount: the timestamp is rendered in the reader's zone
 * and the server renders in UTC, so an SSR pass would print a different string.
 */
export function PublishDateCell({ publishedAt }: { publishedAt: number | null }) {
  const { t, locale } = useI18n();
  const mounted = useMounted();

  if (publishedAt === null) return <span className="text-muted-foreground">—</span>;
  if (!mounted) return <span className="text-muted-foreground" />;

  const date = new Date(publishedAt * 1000);
  const label = date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      {date.getTime() > Date.now() && <Badge variant="default">{t("postList.scheduled")}</Badge>}
    </span>
  );
}
