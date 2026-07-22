import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Extension, ReactRenderer, type Editor, type Range } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { FileTextIcon, NoteIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { searchLinkTargetsFn, type LinkTarget } from "@/server/admin/reads";

// Replace the typed `@query` with the article title carrying a link mark, plus
// a plain trailing space so continued typing isn't linked — skipped when the
// text after the range already starts with one. Exported for tests.
export function insertArticleLink(editor: Editor, range: Range, target: LinkTarget) {
  const doc = editor.state.doc;
  const after = doc.textBetween(range.to, Math.min(range.to + 1, doc.content.size), "\n", "\n");
  const linked = {
    type: "text",
    text: target.title,
    marks: [{ type: "link", attrs: { href: target.url } }],
  };
  editor
    .chain()
    .focus()
    .insertContentAt(range, after === " " ? [linked] : [linked, { type: "text", text: " " }])
    .run();
}

export type LinkSuggestionListHandle = { onKeyDown: (event: KeyboardEvent) => boolean };

type ListProps = {
  items: LinkTarget[];
  loading: boolean;
  query: string;
  command: (target: LinkTarget) => void;
};

// The floating list rendered under the cursor. Mounted via ReactRenderer, which
// portals into the editor's React tree — so app context (i18n) is available.
export const LinkSuggestionList = forwardRef<LinkSuggestionListHandle, ListProps>(
  function LinkSuggestionList({ items, loading, query, command }, ref) {
    const { t } = useI18n();
    const [active, setActive] = useState(0);

    useEffect(() => setActive(0), [items]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: (event) => {
          if (event.key === "ArrowDown") {
            setActive((i) => Math.min(i + 1, items.length - 1));
            return true;
          }
          if (event.key === "ArrowUp") {
            setActive((i) => Math.max(i - 1, 0));
            return true;
          }
          if (event.key === "Enter") {
            if (items[active]) {
              command(items[active]);
              return true;
            }
            return false;
          }
          return false;
        },
      }),
      [items, active, command],
    );

    const status = !query
      ? t("editor.linkSuggestHint")
      : loading && items.length === 0
        ? t("editor.linkSearching")
        : items.length === 0
          ? t("editor.linkNoResults")
          : "";

    return (
      <div className="z-50 w-80 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
        {items.map((r, i) => (
          <Button
            key={r.url}
            type="button"
            variant="ghost"
            onClick={() => command(r)}
            onMouseEnter={() => setActive(i)}
            className={cn(
              "h-auto w-full justify-start gap-2 rounded-none border-b px-3 py-2 text-sm font-normal last:border-b-0",
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
          </Button>
        ))}
        {status && (
          <div className="px-3 py-3 text-center text-sm text-muted-foreground">{status}</div>
        )}
      </div>
    );
  },
);

// `@` mention-style article search: typing `@` pops an inline list of post /
// note titles (searchLinkTargetsFn — same backend as the ⌘K link dialog);
// picking one inserts the title as a normal markdown link, so the stored
// content stays `[title](/posts/slug)` with no custom node type.
export const LinkSuggestion = Extension.create({
  name: "linkSuggestion",

  addProseMirrorPlugins() {
    return [
      Suggestion<LinkTarget, LinkTarget>({
        editor: this.editor,
        pluginKey: new PluginKey("linkSuggestion"),
        char: "@",
        // Titles contain spaces ("Gas Station"), so keep the query open across
        // them; Escape dismisses.
        allowSpaces: true,
        // No prefix requirement: CJK prose has no spaces, so `@` must trigger
        // right after a han character too (the default requires a leading space).
        allowedPrefixes: null,
        minQueryLength: 1,
        debounce: 250,
        items: async ({ query, editor }) => {
          // Never search on a half-formed IME composition buffer; the commit
          // transaction changes the query and re-triggers items().
          if (editor.view.composing) return [];
          return searchLinkTargetsFn({ data: { q: query } });
        },
        command: ({ editor, range, props }) => insertArticleLink(editor, range, props),
        render: () => {
          let component: ReactRenderer<LinkSuggestionListHandle, ListProps> | null = null;
          let unmount: (() => void) | null = null;

          const toListProps = (props: {
            items: LinkTarget[];
            loading: boolean;
            query: string;
            command: (target: LinkTarget) => void;
          }): ListProps => ({
            items: props.items,
            loading: props.loading,
            query: props.query,
            command: props.command,
          });

          return {
            onStart: (props) => {
              component = new ReactRenderer(LinkSuggestionList, {
                editor: props.editor,
                props: toListProps(props),
              });
              unmount = props.mount(component.element);
            },
            onUpdate: (props) => {
              component?.updateProps(toListProps(props));
            },
            onExit: () => {
              unmount?.();
              component?.destroy();
              component = null;
              unmount = null;
            },
            onKeyDown: ({ event }) => component?.ref?.onKeyDown(event) ?? false,
          };
        },
      }),
    ];
  },
});
