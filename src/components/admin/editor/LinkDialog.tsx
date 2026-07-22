import { useEffect, useReducer, useRef } from "react";
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

// Dialog state lives in one reducer so multi-field transitions (a search
// resolving, the dialog reopening) stay atomic instead of being spread across
// half a dozen setState calls.
type State = {
  query: string;
  committed: string;
  composing: boolean;
  results: LinkTarget[];
  loading: boolean;
  active: number;
};

type Action =
  | { type: "reset"; query: string }
  | { type: "typed"; query: string }
  | { type: "composing"; composing: boolean }
  | { type: "committed"; committed: string }
  | { type: "searchStarted" }
  | { type: "searchResolved"; results: LinkTarget[] }
  | { type: "searchCleared" }
  | { type: "activeMoved"; delta: number }
  | { type: "activeSet"; index: number };

const initialState: State = {
  query: "",
  committed: "",
  composing: false,
  results: [],
  loading: false,
  active: 0,
};

export function linkDialogReducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return { ...initialState, query: action.query };
    case "typed":
      return { ...state, query: action.query };
    case "composing":
      return { ...state, composing: action.composing };
    case "committed":
      return { ...state, committed: action.committed };
    case "searchStarted":
      return { ...state, loading: true };
    case "searchResolved":
      return { ...state, results: action.results, loading: false, active: 0 };
    case "searchCleared":
      return { ...state, results: [], loading: false, active: 0 };
    case "activeMoved":
      return {
        ...state,
        active: Math.min(Math.max(state.active + action.delta, 0), state.results.length - 1),
      };
    case "activeSet":
      return { ...state, active: action.index };
  }
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
  const [state, dispatch] = useReducer(linkDialogReducer, initialState);
  const { query, committed, composing, results, loading, active } = state;
  const requestId = useRef(0);

  const editingExisting = open && editor.isActive("link");

  // Opening: prefill with the existing link's href when the cursor sits on one
  // (edit mode); otherwise start clean.
  useEffect(() => {
    if (!open) return;
    dispatch({ type: "reset", query: editor.getAttributes("link").href ?? "" });
  }, [open, editor]);

  // Debounce query → committed, gated on IME composition.
  useEffect(() => {
    if (!open || composing) return;
    const id = setTimeout(
      () => dispatch({ type: "committed", committed: query.trim() }),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [query, composing, open]);

  // Title search for non-URL queries.
  useEffect(() => {
    if (!committed || isUrlLike(committed)) {
      dispatch({ type: "searchCleared" });
      return;
    }
    const id = ++requestId.current;
    dispatch({ type: "searchStarted" });
    searchLinkTargetsFn({ data: { q: committed } })
      .then((rows) => {
        if (id === requestId.current) dispatch({ type: "searchResolved", results: rows });
      })
      .catch(() => {
        if (id === requestId.current) dispatch({ type: "searchResolved", results: [] });
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
      dispatch({ type: "activeMoved", delta: 1 });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      dispatch({ type: "activeMoved", delta: -1 });
    }
  }

  const showEmpty = committed && !urlMode && !loading && results.length === 0;
  const rowClass = "h-auto w-full justify-start gap-2 rounded-none px-3 py-2 text-sm font-normal";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3">
        <DialogHeader>
          <DialogTitle>{t("editor.linkDialogTitle")}</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={query}
          onChange={(e) => dispatch({ type: "typed", query: e.target.value })}
          onCompositionStart={() => dispatch({ type: "composing", composing: true })}
          onCompositionEnd={() => dispatch({ type: "composing", composing: false })}
          onKeyDown={handleKeyDown}
          placeholder={t("editor.linkDialogPlaceholder")}
        />

        {urlMode && query.trim() && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => apply(query.trim(), query.trim())}
            className={cn(rowClass, "rounded-md border")}
          >
            <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{query.trim()}</span>
            <ArrowBendDownLeftIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
          </Button>
        )}

        {!urlMode && (loading || results.length > 0 || showEmpty) && (
          <div className="max-h-64 overflow-y-auto rounded-md border">
            {results.map((r, i) => (
              <Button
                key={r.url}
                type="button"
                variant="ghost"
                onClick={() => apply(r.url, r.title)}
                onMouseEnter={() => dispatch({ type: "activeSet", index: i })}
                className={cn(rowClass, "border-b last:border-b-0", i === active && "bg-muted")}
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
              </Button>
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
