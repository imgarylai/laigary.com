import { memo } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  TextHIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  HighlighterCircleIcon,
  TextSubscriptIcon,
  TextSuperscriptIcon,
  LinkIcon,
  CodeIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarTableMenu } from "./ToolbarTableMenu";
import { ColorPickerPopover } from "./ColorPickerPopover";

// What stays here is what acts on a selection — marks, colour, alignment — plus
// the two structures that are awkward to reach any other way (tables, and the
// link dialog on ⌘K). Block insertion moved to the `/` menu (#173), which names
// each block instead of asking you to recognise an icon.
//
// Memoised, and subscribed to the editor rather than reading it during render.
// The two go together: inline `editor.isActive(...)` calls were only ever
// correct because the document flowed through React state and re-rendered this
// whole subtree on every keystroke — ~15 buttons, their icons, three menus.
// That is what made typing expensive (#175). Reading the flags through
// useEditorState instead means the toolbar repaints when a mark actually turns
// on or off, and not once per character.
export const Toolbar = memo(function Toolbar({
  editor,
  onOpenLink,
}: {
  editor: Editor;
  onOpenLink: () => void;
}) {
  const { t } = useI18n();
  // One selector for every flag the toolbar paints. useEditorState compares
  // with deepEqual, so an unchanged set of flags does not re-render.
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      highlight: e.isActive("highlight"),
      subscript: e.isActive("subscript"),
      superscript: e.isActive("superscript"),
      link: e.isActive("link"),
      code: e.isActive("code"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
    }),
  });

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-md border p-1">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={active.h1}
        title={t("editor.heading1")}
      >
        <TextHIcon className="size-4" weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={active.h2}
        title={t("editor.heading2")}
      >
        <TextHIcon className="size-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={active.bold}
        title={t("editor.bold")}
      >
        <TextBIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={active.italic}
        title={t("editor.italic")}
      >
        <TextItalicIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={active.underline}
        title={t("editor.underline")}
      >
        <TextUnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={active.highlight}
        title={t("editor.highlight")}
      >
        <HighlighterCircleIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={active.subscript}
        title={t("editor.subscript")}
      >
        <TextSubscriptIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={active.superscript}
        title={t("editor.superscript")}
      >
        <TextSuperscriptIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Color */}
      <ColorPickerPopover editor={editor} />

      {/* Text alignment */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              title={t("editor.alignLeft")}
            />
          }
        >
          <TextAlignLeftIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <TextAlignLeftIcon className="size-4" />
            {t("editor.alignLeft")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <TextAlignCenterIcon className="size-4" />
            {t("editor.alignCenter")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <TextAlignRightIcon className="size-4" />
            {t("editor.alignRight")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Code */}
      <ToolbarButton onClick={onOpenLink} isActive={active.link} title={`${t("editor.link")} (⌘K)`}>
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={active.code}
        title={t("editor.inlineCode")}
      >
        <CodeIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Lists stay: they are toggled on existing text as often as inserted. */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={active.bulletList}
        title={t("editor.bulletList")}
      >
        <ListBulletsIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={active.orderedList}
        title={t("editor.orderedList")}
      >
        <ListNumbersIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Table edits (add/remove row & column) have no slash equivalent. */}
      <ToolbarTableMenu editor={editor} />

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Discoverability for the slash menu: typing `/` is faster, but nothing
          on screen would otherwise say it exists. */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertContent("/").run()}
        title={t("editor.slashHint")}
      >
        <PlusIcon className="size-4" />
      </ToolbarButton>
    </div>
  );
});
