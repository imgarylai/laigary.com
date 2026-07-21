import { Link } from "@tanstack/react-router";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

// Prev/next pager for the posts list. Keeps the active q/status filters in the
// URL so paging doesn't drop the current search.
export function AdminPagination({
  page,
  totalPages,
  q,
  status,
}: {
  page: number;
  totalPages: number;
  q?: string;
  status?: "draft" | "published";
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  const base = { q: q || undefined, status };

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        render={
          page <= 1 ? <span /> : <Link to="/admin/posts" search={{ ...base, page: page - 1 }} />
        }
      >
        <CaretLeftIcon />
        {t("pagination.prev")}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t("pagination.page", { current: String(page), total: String(totalPages) })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        render={
          page >= totalPages ? (
            <span />
          ) : (
            <Link to="/admin/posts" search={{ ...base, page: page + 1 }} />
          )
        }
      >
        {t("pagination.next")}
        <CaretRightIcon />
      </Button>
    </div>
  );
}
