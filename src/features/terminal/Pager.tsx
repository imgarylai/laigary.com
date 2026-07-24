import { TmButton } from "./Button";
import { AsciiRule } from "./ui";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

// Windowed page-number list: always 1 and last, current ±1, `null` marks a
// gap (rendered as an ellipsis). Keeps long lists (interview sections with
// hundreds of notes) from overflowing the row.
export function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set([1, 2, current - 1, current, current + 1, total - 1, total]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (const [i, n] of pages.entries()) {
    if (i > 0 && n - pages[i - 1] > 1) out.push(null);
    out.push(n);
  }
  return out;
}

// Shared terminal pager (posts archive / interview sections). Purely
// presentational: the page number lives in the route's search params and the
// caller navigates in `onPage`.
export function TmPager({
  current,
  totalPages,
  from,
  to,
  total,
  onPage,
}: {
  current: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  return (
    <div className="mt-9">
      <AsciiRule className="mb-4" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-tm-muted">
          {t("blog.archive.page", { current: String(current), total: String(totalPages) })}
          <span className="text-tm-dim">
            {t("blog.archive.showing", {
              from: String(from),
              to: String(to),
              total: String(total),
            })}
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          <TmButton
            type="button"
            size="sm"
            disabled={current === 1}
            onClick={() => onPage(current - 1)}
          >
            {t("blog.archive.newer")}
          </TmButton>
          {pageWindow(current, totalPages).map((n, i) =>
            n === null ? (
              // eslint-disable-next-line react/no-array-index-key
              <span key={`gap-${i}`} className="px-1 text-sm text-tm-dim">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPage(n)}
                className={cn(
                  "min-w-6 cursor-pointer border border-transparent px-2 py-1 text-sm",
                  n === current ? "border-tm-accent text-tm-accent" : "text-tm-muted",
                )}
              >
                {n}
              </button>
            ),
          )}
          <TmButton
            type="button"
            size="sm"
            disabled={current === totalPages}
            onClick={() => onPage(current + 1)}
          >
            {t("blog.archive.older")}
          </TmButton>
        </div>
      </div>
    </div>
  );
}
