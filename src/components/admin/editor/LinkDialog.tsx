import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ArrowBendDownLeftIcon, FileTextIcon, LinkIcon, NoteIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { searchLinkTargetsFn, type LinkTarget } from "@/server/admin/reads";

const DEBOUNCE_MS = 250;

// Anything that already reads as a URL/anchor is linked verbatim; everything
// else is treated as a title search across posts + interview notes.
export function isUrlLike(value: string): boolean {
  return /^(https?:\/\/|\/|#|mailto:)/i.test(value.trim());
}

// Insert-or-edit link dialog (⌘K in the editor, or the toolbar link button).
// One input, two modes: paste a URL, or type to search posts & notes by title
// and link to the picked article. Search is debounced and IME-safe — nothing
// fires while a CJK composition is in flight.
export function LinkDialog({
  editor,
  open,
  onOpenChange,
}: {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [composing, setComposing] = useState(false);
  const [results, setResults] = useState<LinkTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const requestId = useRef(0);

  const editingExisting = open && editor.isActive("link");

  // Opening: prefill with the existing link's href when the cursor sits on one
  // (edit mode); otherwise start clean.
  useEffect(() => {
    if (!open) return;
    const href: string = editor.getAttributes("link").href ?? "";
    setQuery(href);
    setCommitted("");
    setResults([]);
    setActive(0);
    setLoading(false);
    // The dialog animates in; focus + select once the input exists.
  }, [open, editor]);

  // Debounce query → committed, gated on IME composition.
  useEffect(() => {
    if (!open || composing) return;
    const id = setTimeout(() => setCommitted(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, composing, open]);

  // Title search for non-URL queries.
  useEffect(() => {
    if (!committed || isUrlLike(committed)) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    searchLinkTargetsFn({ data: { q: committed } })
      .then((rows) => {
        if (id !== requestId.current) return;
        setResults(rows);
        setActive(0);
      })
      .catch(() => {
        if (id === requestId.current) setResults([]);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [committed]);

  // Apply a link: to the selection (extended over any existing link mark), or
  // — with a bare cursor — insert the target's title as new linked text.
  function apply(href: string, fallbackText: string) {
    const { empty } = editor.state.selection;
    if (empty && !editor.isActive("link")) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: fallbackText || href,
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    onOpenChange(false);
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onOpenChange(false);
  }

  const urlMode = isUrlLike(query);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (composing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (urlMode && query.trim()) apply(query.trim(), query.trim());
      else if (results[active]) apply(results[active].url, results[active].title);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    }
  }

  const showEmpty = committed && !urlMode && !loading && results.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3">
        <DialogHeader>
          <DialogTitle>{t("editor.linkDialogTitle")}</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={handleKeyDown}
          placeholder={t("editor.linkDialogPlaceholder")}
        />

        {urlMode && query.trim() && (
          <button
            type="button"
            onClick={() => apply(query.trim(), query.trim())}
            className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
          >
            <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{query.trim()}</span>
            <ArrowBendDownLeftIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
          </button>
        )}

        {!urlMode && (loading || results.length > 0 || showEmpty) && (
          <div className="max-h-64 overflow-y-auto rounded-md border">
            {results.map((r, i) => (
              <button
                key={r.url}
                type="button"
                onClick={() => apply(r.url, r.title)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0",
                  i === active && "bg-muted",
                )}
              >
                {r.type === "post" ? (
                  <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <NoteIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{r.title}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1.5">
                  {r.status === "draft" && (
                    <Badge variant="outline" className="text-[10px]">
                      {t("editor.linkDraftBadge")}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {r.type === "post" ? t("editor.linkPostBadge") : r.context}
                  </Badge>
                </span>
              </button>
            ))}
            {loading && results.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t("editor.linkSearching")}
              </div>
            )}
            {showEmpty && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                {t("editor.linkNoResults")}
              </div>
            )}
          </div>
        )}

        {editingExisting && (
          <Button type="button" variant="outline" size="sm" onClick={removeLink}>
            {t("editor.linkRemove")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
