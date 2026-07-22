import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
// KaTeX styles power the editor's live inline-math rendering (MathExtension).
// Imported here so it code-splits into the client-only editor chunk rather than
// the SSR worker bundle. The read-only frontend renders math via temml → MathML
// (see lib/markdown.ts), so it needs no KaTeX CSS.
import "katex/dist/katex.min.css";
import { Button } from "@/components/ui/button";
import { renderMarkdown } from "@/lib/markdown";
import { useI18n } from "@/i18n/I18nProvider";
import { createExtensions } from "./editor/extensions";
import { Toolbar } from "./editor/Toolbar";
import { CharacterCount } from "./editor/CharacterCount";
import { LinkDialog } from "./editor/LinkDialog";

export default function TiptapEditorImpl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const [showPreview, setShowPreview] = useState(true);
  const [previewHtml, setPreviewHtml] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createExtensions({ placeholder: t("editor.placeholder") }),
    content: value,
    contentType: "markdown",
    onUpdate: ({ editor: e }) => {
      onChange(e.getMarkdown());
    },
  });

  // Sync external value changes (e.g. form reset) back into the editor.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // Never rebuild the document while an IME composition is in flight (CJK —
    // 注音/拼音/かな). setContent tears down and re-parses the whole doc, which
    // aborts the composition mid-selection: that's the "cursor jumps / the
    // character gets typed twice / lag" behaviour. When composition ends the
    // effect runs again with the committed text, so nothing is dropped.
    if (editor.view.composing) return;
    const currentMd = editor.getMarkdown();
    // Only sync genuine external changes; our own onUpdate echoes back an equal
    // value, so this skips the self-inflicted round-trip. emitUpdate: false
    // keeps an external set from bouncing another onChange back to the parent.
    if (value !== currentMd) {
      editor.commands.setContent(value, { emitUpdate: false, contentType: "markdown" });
    }
  }, [value, editor]);

  // Preview rendering
  useEffect(() => {
    if (!showPreview) return;
    const timeout = setTimeout(async () => {
      const html = await renderMarkdown(value);
      setPreviewHtml(html);
    }, 200);
    return () => clearTimeout(timeout);
  }, [value, showPreview]);

  if (!editor) return null;

  // The admin sidebar (shadcn) binds Cmd/Ctrl+B on `window` to toggle itself.
  // That collides with Tiptap's bold shortcut: typing Cmd/Ctrl+B inside the
  // editor would both bold the text and toggle the sidebar. ProseMirror handles
  // the key on the editable element first (bold applies), so stopping the event
  // here — as it bubbles out of the editor — keeps bold working while preventing
  // it from ever reaching the sidebar's window listener. Scoped to the editor,
  // so Cmd/Ctrl+B still toggles the sidebar everywhere else.
  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.stopPropagation();
    }
    // ⌘K / Ctrl+K → link dialog (paste a URL or search posts/notes by title).
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      e.stopPropagation();
      setLinkOpen(true);
    }
  }

  return (
    <div className="space-y-2" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("postForm.content")}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview((prev) => !prev)}
        >
          {showPreview ? <EyeSlashIcon className="mr-1.5" /> : <EyeIcon className="mr-1.5" />}
          {showPreview ? t("postForm.hidePreview") : t("postForm.showPreview")}
        </Button>
      </div>

      <Toolbar editor={editor} onOpenLink={() => setLinkOpen(true)} />
      <LinkDialog editor={editor} open={linkOpen} onOpenChange={setLinkOpen} />

      <div className={showPreview ? "grid grid-cols-2 gap-4" : ""}>
        <div className="rounded-md border">
          <EditorContent
            editor={editor}
            className="prose dark:prose-invert max-w-none min-h-[500px] p-4 text-sm [&_.ProseMirror]:min-h-[468px] [&_.ProseMirror]:outline-none"
          />
          <CharacterCount editor={editor} />
        </div>

        {showPreview && (
          <div className="min-h-[500px] overflow-auto rounded-md border p-4">
            {previewHtml ? (
              <div
                className="prose dark:prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("postForm.previewPlaceholder")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
