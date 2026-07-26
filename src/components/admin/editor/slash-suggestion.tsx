import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Extension, ReactRenderer, type Editor, type Range } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import {
  CodeBlockIcon,
  ImageIcon,
  ListBulletsIcon,
  ListChecksIcon,
  ListNumbersIcon,
  MinusIcon,
  QuotesIcon,
  TableIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  YoutubeLogoIcon,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { restoreCaretAfterMount } from "./code-block";

/** Opens the dialogs that live in the editor's React tree, not in the schema. */
export type SlashDialogs = {
  openImage: () => void;
  openYouTube: () => void;
};

export type SlashItem = {
  /** i18n key under `editor.slash.*`, and the item's identity. */
  key: string;
  icon: Icon;
  /** Matched against the typed query. Deliberately English and untranslated:
   *  slash commands are typed as commands, and the admin UI switches language
   *  while `/code` should keep working either way. */
  keywords: string[];
  run: (editor: Editor, range: Range, dialogs: SlashDialogs) => void;
};

const chainAt = (editor: Editor, range: Range) => editor.chain().focus().deleteRange(range);

export const SLASH_ITEMS: SlashItem[] = [
  {
    key: "heading2",
    icon: TextHTwoIcon,
    keywords: ["heading", "h2", "title"],
    run: (editor, range) => chainAt(editor, range).toggleHeading({ level: 2 }).run(),
  },
  {
    key: "heading3",
    icon: TextHThreeIcon,
    keywords: ["heading", "h3", "subtitle"],
    run: (editor, range) => chainAt(editor, range).toggleHeading({ level: 3 }).run(),
  },
  {
    key: "codeBlock",
    icon: CodeBlockIcon,
    keywords: ["code", "snippet", "fence", "pre"],
    // Opens untagged (the attribute defaults to null); the card's picker (#170)
    // is where the language gets set.
    run: (editor, range) => {
      chainAt(editor, range).setCodeBlock().run();
      restoreCaretAfterMount(editor);
    },
  },
  {
    key: "bulletList",
    icon: ListBulletsIcon,
    keywords: ["bullet", "list", "unordered", "ul"],
    run: (editor, range) => chainAt(editor, range).toggleBulletList().run(),
  },
  {
    key: "orderedList",
    icon: ListNumbersIcon,
    keywords: ["ordered", "list", "numbered", "ol"],
    run: (editor, range) => chainAt(editor, range).toggleOrderedList().run(),
  },
  {
    key: "taskList",
    icon: ListChecksIcon,
    keywords: ["task", "todo", "checklist", "check"],
    run: (editor, range) => chainAt(editor, range).toggleTaskList().run(),
  },
  {
    key: "blockquote",
    icon: QuotesIcon,
    keywords: ["quote", "blockquote", "citation"],
    run: (editor, range) => chainAt(editor, range).toggleBlockquote().run(),
  },
  {
    key: "table",
    icon: TableIcon,
    keywords: ["table", "grid"],
    run: (editor, range) =>
      chainAt(editor, range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    key: "image",
    icon: ImageIcon,
    keywords: ["image", "picture", "photo", "upload"],
    run: (editor, range, dialogs) => {
      chainAt(editor, range).run();
      dialogs.openImage();
    },
  },
  {
    key: "youtube",
    icon: YoutubeLogoIcon,
    keywords: ["youtube", "video", "embed"],
    run: (editor, range, dialogs) => {
      chainAt(editor, range).run();
      dialogs.openYouTube();
    },
  },
  {
    key: "horizontalRule",
    icon: MinusIcon,
    keywords: ["divider", "rule", "separator", "hr", "line"],
    run: (editor, range) => chainAt(editor, range).setHorizontalRule().run(),
  },
];

/** Exported for tests: the items a query should offer, in menu order. */
export function filterSlashItems(query: string): SlashItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return SLASH_ITEMS;

  return SLASH_ITEMS.filter(
    (item) =>
      item.key.toLowerCase().startsWith(needle) ||
      item.keywords.some((keyword) => keyword.startsWith(needle)),
  );
}

export type SlashListHandle = { onKeyDown: (event: KeyboardEvent) => boolean };

export type ListProps = { items: SlashItem[]; command: (item: SlashItem) => void };

export const SlashList = forwardRef<SlashListHandle, ListProps>(function SlashList(
  { items, command },
  ref,
) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);

  useEffect(() => setActive(0), [items]);

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: (event) => {
        if (event.key === "ArrowDown") {
          setActive((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setActive((i) => (i - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          if (!items[active]) return false;
          command(items[active]);
          return true;
        }
        return false;
      },
    }),
    [items, active, command],
  );

  if (items.length === 0) return null;

  return (
    <div className="z-50 w-64 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
      {items.map((item, i) => (
        <Button
          key={item.key}
          type="button"
          variant="ghost"
          onClick={() => command(item)}
          onMouseEnter={() => setActive(i)}
          className={cn(
            "h-auto w-full justify-start gap-2 rounded-none border-b px-3 py-2 text-sm font-normal last:border-b-0",
            i === active && "bg-muted",
          )}
        >
          <item.icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{t(`editor.slash.${item.key}`)}</span>
        </Button>
      ))}
    </div>
  );
});

/**
 * `/` block-insert menu — the primary door for everything that used to need a
 * toolbar button (#173).
 *
 * Built on the same Suggestion + ReactRenderer plumbing as the `@` article
 * mention in link-suggestion.tsx, so the list renders inside the editor's React
 * tree and has i18n context.
 */
export function createSlashSuggestion(dialogs: SlashDialogs) {
  return Extension.create({
    name: "slashSuggestion",

    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem, SlashItem>({
          editor: this.editor,
          pluginKey: new PluginKey("slashSuggestion"),
          char: "/",
          // Default prefixes (start of block or after whitespace) are kept on
          // purpose: `/` is far too common mid-text — every URL path and every
          // division — to trigger a menu there.
          startOfLine: false,
          items: ({ query }) => filterSlashItems(query),
          command: ({ editor, range, props }) => props.run(editor, range, dialogs),
          // A slash inside a code block is code, never a command.
          allow: ({ editor }) => !editor.isActive("codeBlock"),
          render: () => {
            let component: ReactRenderer<SlashListHandle, ListProps> | null = null;
            let unmount: (() => void) | null = null;

            const toListProps = (props: {
              items: SlashItem[];
              command: (item: SlashItem) => void;
            }): ListProps => ({ items: props.items, command: props.command });

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashList, {
                  editor: props.editor,
                  props: toListProps(props),
                });
                unmount = props.mount(component.element);
              },
              onUpdate: (props) => component?.updateProps(toListProps(props)),
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
}
