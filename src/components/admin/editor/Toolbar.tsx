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
  CodeBlockIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  ListChecksIcon,
  QuotesIcon,
  MinusIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
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
import { YouTubeDialog } from "./YouTubeDialog";
import { ImageUploadDialog } from "./ImageUploadDialog";

export function Toolbar({ editor }: { editor: Editor }) {
  const { t } = useI18n();

  function addLink() {
    const url = window.prompt("URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

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
      <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} title={t("editor.link")}>
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title={t("editor.inlineCode")}
      >
        <CodeIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title={t("editor.codeBlock")}
      >
        <CodeBlockIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Lists */}
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
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
        title={t("editor.taskList")}
      >
        <ListChecksIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title={t("editor.blockquote")}
      >
        <QuotesIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Table */}
      <ToolbarTableMenu editor={editor} />

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Media / Insert */}
      <ImageUploadDialog editor={editor} />
      <YouTubeDialog editor={editor} />
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title={t("editor.horizontalRule")}
      >
        <MinusIcon className="size-4" />
      </ToolbarButton>
    </div>
  );
}
