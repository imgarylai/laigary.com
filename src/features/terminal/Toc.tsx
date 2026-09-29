import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useActiveHeading } from "@/hooks/use-active-heading";
import { useHashSync } from "@/hooks/use-hash-sync";
import { useI18n } from "@/i18n/I18nProvider";
import type { TocEntry } from "@/lib/toc";

// Table of contents for a post/note.
//
// Desktop uses a sticky gutter bounded by the reading layout; mobile uses a drawer.
//
// Entries link with plain anchors, so they work before hydration; the sticky
// header is cleared by the `scroll-mt-*` on headings (see terminal.css).

// Most notes are short problem write-ups with no headings at all; a one-entry
// list is noise rather than navigation.
const MIN_ENTRIES = 2;

export function Toc({ entries }: { entries: readonly TocEntry[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ids = useMemo(() => entries.map((e) => e.id), [entries]);
  const activeId = useActiveHeading(ids);
  useHashSync(activeId);

  // Close the drawer on Escape, matching the palette's dismissal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (entries.length < MIN_ENTRIES) return null;

  const list = <TocList entries={entries} activeId={activeId} onNavigate={() => setOpen(false)} />;

  return (
    <>
      <aside className="public-toc-gutter hidden xl:block">
        <nav
          aria-label={t("blog.post.toc")}
          tabIndex={0}
          className="public-toc-scroll sticky top-24 max-h-[min(45dvh,24rem)] overflow-y-scroll overscroll-contain"
        >
          {list}
        </nav>
      </aside>

      {/* Below xl: edge toggle + drawer. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="tm-toc-drawer"
        aria-label={t("blog.post.tocToggle")}
        className="fixed top-1/2 left-0 z-30 -translate-y-1/2 border border-l-0 border-tm-border bg-tm-bg px-1.5 py-3 text-tm-muted xl:hidden"
      >
        <span aria-hidden className="block text-xs leading-none">
          {open ? "‹" : "›"}
        </span>
      </button>

      {open && (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-tm-bg/70 xl:hidden"
        />
      )}

      <div
        id="tm-toc-drawer"
        hidden={!open}
        className="fixed inset-y-0 left-0 z-30 w-64 max-w-[80vw] overflow-y-auto overscroll-contain border-r border-tm-border bg-tm-bg px-3.5 py-4 xl:hidden"
      >
        <nav aria-label={t("blog.post.toc")}>{list}</nav>
      </div>
    </>
  );
}

function TocList({
  entries,
  activeId,
  onNavigate,
}: {
  entries: readonly TocEntry[];
  activeId: string | null;
  onNavigate: () => void;
}) {
  return (
    <ul className="m-0 list-none p-0">
      {entries.map((entry) => {
        const active = entry.id === activeId;
        return (
          <li key={entry.id}>
            <a
              href={`#${encodeURIComponent(entry.id)}`}
              onClick={onNavigate}
              aria-current={active ? "location" : undefined}
              className={cn(
                "block border-l py-1 pr-1 text-xs leading-snug no-underline",
                entry.depth === 3 ? "pl-5" : "pl-2.5",
                active
                  ? "border-tm-accent text-tm-accent"
                  : "border-tm-border text-tm-muted hover:text-tm-fg",
              )}
            >
              {entry.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
