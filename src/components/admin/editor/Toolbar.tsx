import type { Editor } from "@tiptap/react";
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
export function Toolbar({ editor, onOpenLink }: { editor: Editor; onOpenLink: () => void }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-md border p-1">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title={t("editor.heading1")}
      >
        <TextHIcon className="size-4" weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title={t("editor.heading2")}
      >
        <TextHIcon className="size-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title={t("editor.bold")}
      >
        <TextBIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title={t("editor.italic")}
      >
        <TextItalicIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title={t("editor.underline")}
      >
        <TextUnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive("highlight")}
        title={t("editor.highlight")}
      >
        <HighlighterCircleIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={editor.isActive("subscript")}
        title={t("editor.subscript")}
      >
        <TextSubscriptIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive("superscript")}
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
      <ToolbarButton
        onClick={onOpenLink}
        isActive={editor.isActive("link")}
        title={`${t("editor.link")} (⌘K)`}
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title={t("editor.inlineCode")}
      >
        <CodeIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Lists stay: they are toggled on existing text as often as inserted. */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title={t("editor.bulletList")}
      >
        <ListBulletsIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
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
}
