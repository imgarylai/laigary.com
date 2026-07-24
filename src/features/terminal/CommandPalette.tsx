import { useEffect, useRef, useState } from "react";
import { CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList } from "./CommandMenu";
import { useI18n } from "@/i18n/I18nProvider";

export type PaletteRow = {
  kind: "page" | "content";
  label: string;
  sub?: string;
  // Extra text matched against the query, on top of the label (title / slug).
  haystack: string;
  onSelect: () => void;
};

const DEBOUNCE_MS = 180;

function matches(row: PaletteRow, q: string): boolean {
  return `${row.label} ${row.haystack}`.toLowerCase().includes(q);
}

// ⌘K command palette. Only the static page rows are pre-loaded; content rows
// (posts / notes) are fetched on demand once the user types, via `searchContent`
// — so navigating no longer ships the whole index. cmdk's built-in filtering is
// off (`shouldFilter={false}`); pages are filtered locally and content comes
// pre-filtered from the server.
//
// CJK-safe: while an IME composition is in flight (組字中) neither the local
// filter re-commits nor the server search fires — both wait for the composition
// to commit, so we never search on half-formed characters.
export function CommandPalette({
  open,
  onOpenChange,
  pages,
  searchContent,
  placeholder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PaletteRow[];
  searchContent: (query: string) => Promise<PaletteRow[]>;
  placeholder: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  // `committed` lags `query`: it only advances when not composing and after the
  // debounce, and it's what both the page filter and the content search key off.
  const [committed, setCommitted] = useState("");
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState<PaletteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  // Reset everything when the dialog closes so it reopens clean.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setCommitted("");
      setComposing(false);
      setContent([]);
      setLoading(false);
    }
  }, [open]);

  // Debounce query → committed, but never while composing (wait for commit).
  useEffect(() => {
    if (composing) return;
    const id = setTimeout(() => setCommitted(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, composing]);

  // Fetch content for the committed query. Empty query → no content (pages only).
  useEffect(() => {
    if (!committed) {
      setContent([]);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    searchContent(committed)
      .then((rows) => {
        if (id === requestId.current) setContent(rows);
      })
      .catch(() => {
        if (id === requestId.current) setContent([]);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [committed, searchContent]);

  const q = committed.toLowerCase();
  const shownPages = q ? pages.filter((p) => matches(p, q)) : pages;

  // A status line shows only when there are no rows to display: a prompt to type
  // (empty query), a "searching…" note (content request in flight), or a
  // no-matches message once results are in.
  let status = "";
  if (!committed) {
    if (shownPages.length === 0) status = t("blog.search.typeToSearch");
  } else if (loading && content.length === 0) {
    status = t("blog.search.searching");
  } else if (shownPages.length === 0 && content.length === 0) {
    status = t("blog.search.noMatches");
  }

  // Rows stack vertically so the primary line gets the full row width instead of
  // sharing it side-by-side (on narrow screens the title used to get squeezed
  // out). Content rows lead with the human title and tuck the file path
  // underneath; page rows lead with the command. Either way the second line is
  // the smaller, dimmed one.
  const renderItem = (row: PaletteRow, i: number) => {
    const isContent = row.kind === "content";
    const primary = (isContent ? row.sub : row.label) ?? row.label;
    const secondary = isContent ? row.label : row.sub;
    return (
      <CommandItem
        key={`${row.kind}-${i}-${row.label}`}
        value={`${row.kind}-${i}-${row.label} ${row.haystack}`}
        onSelect={() => {
          row.onSelect();
          onOpenChange(false);
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-tm-fg">{primary}</span>
          {secondary && <span className="truncate text-xs text-tm-muted">{secondary}</span>}
        </div>
      </CommandItem>
    );
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description={placeholder}
      shouldFilter={false}
    >
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
      />
      <CommandList>
        {shownPages.length > 0 && (
          <CommandGroup heading={t("blog.search.pages")}>{shownPages.map(renderItem)}</CommandGroup>
        )}
        {committed && content.length > 0 && (
          <CommandGroup heading={t("blog.search.content")}>{content.map(renderItem)}</CommandGroup>
        )}
        {status && (
          <div className="py-6 text-center text-sm text-tm-muted" data-slot="command-status">
            {status}
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
