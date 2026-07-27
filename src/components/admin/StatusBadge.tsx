import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * The draft/published badge in the post and note lists (#181).
 *
 * It used to print the raw database value, so the badge read `published` /
 * `draft` in English while the status filter immediately beside it was
 * translated — same concept, two languages, one screen. The keys it needs are
 * the ones that filter already uses.
 *
 * Emphasis is the other half. Published was the solid fill and draft the muted
 * one, which is backwards: published is the normal state of most rows and wants
 * no attention, while draft is the exception you are scanning the list for. The
 * marked treatment belongs on draft, and published recedes to an outline.
 *
 * Shared because both lists had their own identical copy of this cell, which is
 * how both of them were wrong in exactly the same two ways.
 */
export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const published = status === "published";

  return (
    <Badge variant={published ? "outline" : "default"}>
      {t(published ? "postForm.published" : "postForm.draft")}
    </Badge>
  );
}
