import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
// KaTeX styles power the editor's live inline-math rendering (MathExtension).
// Imported here so it code-splits into the client-only editor chunk rather than
// the SSR worker bundle. The read-only frontend renders math via temml → MathML
// (see lib/markdown.ts), so it needs no KaTeX CSS.
import "katex/dist/katex.min.css";
import { renderMarkdown } from "@/lib/markdown";
import { Prose } from "@/features/terminal/Prose";
import { useI18n } from "@/i18n/I18nProvider";
import { createExtensions } from "./editor/extensions";
import { Toolbar } from "./editor/Toolbar";
import { CharacterCount } from "./editor/CharacterCount";
import { LinkDialog } from "./editor/LinkDialog";
import { ImageUploadDialog } from "./editor/ImageUploadDialog";
import { YouTubeDialog } from "./editor/YouTubeDialog";

/** Height of the sticky action bar + toolbar above the panes, in px — the point
 *  the editor pane has scrolled "past". Matches top-24 on the preview. */
const STICKY_OFFSET_PX = 96;

// requestIdleCallback is unavailable in Safari <18 and in jsdom; a timeout is a
// close enough stand-in for work that is already debounced.
const requestIdle: (cb: () => void) => number =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (cb) => window.requestIdleCallback(cb)
    : (cb) => window.setTimeout(cb, 1);

const cancelIdle: (handle: number) => void =
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? (handle) => window.cancelIdleCallback(handle)
    : (handle) => window.clearTimeout(handle);

export default function TiptapEditorImpl({
  value,
  onChange,
  showPreview,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Owned by EditorShell: the toggle lives in the action bar, and the column
   *  width depends on it. */
  showPreview: boolean;
}) {
  const { t } = useI18n();
  const [previewHtml, setPreviewHtml] = useState("");
  const editorPaneRef = useRef<HTMLDivElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  // The markdown this editor last handed to the form. Everything below keys off
  // it to tell "the parent is echoing our own change back" apart from "the form
  // was reset from outside".
  const lastEmittedRef = useRef(value);
  // The insert dialogs live here, not inside the toolbar, because the `/` menu
  // opens them too — one dialog, two doors. `useState` setters are stable, so
  // the extensions can close over them despite being built only once.
  const [imageOpen, setImageOpen] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createExtensions({
      placeholder: t("editor.placeholder"),
      dialogs: {
        openImage: () => setImageOpen(true),
        openYouTube: () => setYoutubeOpen(true),
      },
    }),
    content: value,
    contentType: "markdown",
    onUpdate: ({ editor: e }) => {
      const markdown = e.getMarkdown();
      lastEmittedRef.current = markdown;
      onChange(markdown);
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

    // The common case by far: the parent is handing back the very string we
    // just gave it. Recognising that from a ref costs a comparison, where
    // re-serializing the document to discover the same thing cost a second full
    // getMarkdown() on every keystroke.
    if (value === lastEmittedRef.current) return;

    // Genuine external change (a form reset, or a loader re-run). emitUpdate:
    // false keeps the set from bouncing another onChange back to the parent.
    if (value !== editor.getMarkdown()) {
      editor.commands.setContent(value, { emitUpdate: false, contentType: "markdown" });
    }
    lastEmittedRef.current = value;
  }, [value, editor]);

  // Preview rendering. renderMarkdown is the whole unified pipeline — remark,
  // temml, rehype-highlight — so it never runs while a keystroke might still be
  // in flight: debounced, then deferred to idle time. The preview trailing the
  // caret by a moment is invisible; a pipeline run competing with typing is not.
  useEffect(() => {
    if (!showPreview) return;

    let cancelled = false;
    let idleHandle: number | undefined;

    const timeout = setTimeout(() => {
      idleHandle = requestIdle(async () => {
        const html = await renderMarkdown(value);
        if (!cancelled) setPreviewHtml(html);
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (idleHandle !== undefined) cancelIdle(idleHandle);
    };
  }, [value, showPreview]);

  // Keep the preview roughly where the editor is. The two panes scroll on
  // different axes now — the document grows the page, while the preview is
  // pinned and scrolls inside itself — so without this the left pane can show
  // Python while the right still shows TypeScript. Proportional rather than
  // line-mapped: the rendered output has different heights from the source, so
  // an exact mapping would need position tracking the markdown pipeline does
  // not carry.
  useEffect(() => {
    if (!showPreview) return;

    function syncPreviewScroll() {
      const pane = editorPaneRef.current;
      const preview = previewPaneRef.current;
      if (!pane || !preview) return;

      const rect = pane.getBoundingClientRect();
      const travel = rect.height - preview.clientHeight;
      if (travel <= 0) return;

      const ratio = Math.min(1, Math.max(0, (STICKY_OFFSET_PX - rect.top) / travel));
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    }

    window.addEventListener("scroll", syncPreviewScroll, { passive: true });
    syncPreviewScroll();
    return () => window.removeEventListener("scroll", syncPreviewScroll);
  }, [showPreview, previewHtml]);

  // Stable, or the memo on Toolbar buys nothing: a fresh arrow function each
  // render would fail the prop comparison every time.
  const openLink = useCallback(() => setLinkOpen(true), []);

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
    <div onKeyDown={handleKeyDown}>
      {/* Sticky under the action bar (top-0, ~h-11), so formatting stays in
          reach in a long document without giving the editor its own scrollbar. */}
      <div className="sticky top-11 z-10 bg-background py-2">
        <Toolbar editor={editor} onOpenLink={openLink} />
      </div>

      <LinkDialog editor={editor} open={linkOpen} onOpenChange={setLinkOpen} />
      <ImageUploadDialog editor={editor} open={imageOpen} onOpenChange={setImageOpen} />
      <YouTubeDialog editor={editor} open={youtubeOpen} onOpenChange={setYoutubeOpen} />

      {/* One scrollbar: the editor grows with its content and the page scrolls.
          The preview is the exception — it is a different length from the
          document, so it sticks to the viewport and scrolls inside itself. */}
      <div className={showPreview ? "flex items-start gap-6" : ""}>
        {/* `tm-code` opts the writable surface into the site's own code styling
            (terminal.css) so a fence looks here exactly like it will once
            published; `prose` still handles headings, lists and the rest. */}
        <div ref={editorPaneRef} className={showPreview ? "min-w-0 flex-1" : ""}>
          <EditorContent
            editor={editor}
            className="tm-code prose dark:prose-invert max-w-none text-sm [&_.ProseMirror]:min-h-[60vh] [&_.ProseMirror]:outline-none"
          />
          <CharacterCount editor={editor} />
        </div>

        {/* The preview renders pipeline output, so it uses the very component
            the public page uses — same markup, same CSS, no second opinion. */}
        {showPreview && (
          <div
            ref={previewPaneRef}
            className="sticky top-24 max-h-[calc(100vh-8rem)] min-w-0 flex-1 overflow-auto rounded-md border p-4"
          >
            {previewHtml ? (
              <Prose html={previewHtml} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("postForm.previewPlaceholder")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
