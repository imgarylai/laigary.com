// Pasting markdown source used to land as literal text: a table stayed a row of
// pipes, `[a](b)` stayed brackets. @tiptap/markdown only wires up getMarkdown()
// and setContent/insertContent's `contentType` — it never touches the
// clipboard, so paste went through ProseMirror's default plain-text path.
//
// Extension comes from @tiptap/react, which re-exports @tiptap/core — pnpm does
// not expose the latter transitively (same route image-upload.ts takes).
import { Extension } from "@tiptap/react";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";

// Each pattern is one unambiguous markdown construct. Deliberately conservative:
// text that matches none of these pastes exactly as it did before, because
// running plain prose through a markdown parser is not free — single newlines
// collapse into one paragraph, and `*` or `_` in ordinary text become emphasis.
const MARKDOWN_PATTERNS: readonly RegExp[] = [
  /^#{1,6}[ \t]+\S/m, // ATX heading
  /^(?:```|~~~)/m, // fenced code block
  /^[ \t]*>[ \t]+\S/m, // blockquote
  /^[ \t]*[-*+][ \t]+\S/m, // bullet list (task lists included)
  /^[ \t]*\d+[.)][ \t]+\S/m, // ordered list
  /^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/m, // thematic break
  /\[[^\]\n]*\]\([^)\n]*\)/, // link or image
  /\*\*[^\s*][^*]*\*\*/, // bold
  /(?:^|\s)\*[^\s*][^*]*\*(?:\s|$)/, // italic — the spaces keep `a * b` out
  /(?:^|\s)_[^\s_][^_]*_(?:\s|$)/, // italic, underscore form
  /~~[^\s~][^~]*~~/, // strikethrough
  /`[^`\n]+`/, // inline code
];

// A table needs both a pipe row and the dashed delimiter under it; a lone line
// containing `|` is far more likely to be console output than markdown.
const TABLE_ROW = /^[ \t]*\|.*\|[ \t]*$/m;
const TABLE_DELIMITER = /^[ \t]*\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)*\|?[ \t]*$/m;

/** Whether pasted text carries enough markdown syntax to be worth parsing. */
export function looksLikeMarkdown(text: string): boolean {
  if (TABLE_ROW.test(text) && TABLE_DELIMITER.test(text)) return true;
  return MARKDOWN_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Whether the caret sits somewhere the pasted characters have to survive
 * verbatim — a code block, or an inline `code` span. Parsing there would
 * rewrite the very thing the author is trying to quote.
 */
export function isVerbatimContext(state: EditorState): boolean {
  const { $from, empty } = state.selection;
  if ($from.parent.type.spec.code) return true;

  const codeMark = state.schema.marks.code;
  if (!codeMark) return false;
  // storedMarks applies to a collapsed selection that has just been toggled;
  // $from.marks() covers the caret sitting inside an existing span.
  const marks = (empty ? state.storedMarks : null) ?? $from.marks();
  return marks.some((mark) => mark.type === codeMark);
}

export const MarkdownPaste = Extension.create({
  name: "markdownPaste",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey("markdownPaste"),
        props: {
          handlePaste(view, event) {
            const clipboard = event.clipboardData;
            if (!clipboard) return false;

            // An image on the clipboard belongs to the upload plugin. Checked
            // here rather than relying on plugin order, so neither handler
            // depends on where the other sits in the extension list.
            if (clipboard.files.length > 0) return false;

            // Rich text (a copy from a web page, or from this editor) already
            // arrives as real nodes through ProseMirror's own HTML parsing,
            // which knows about the source structure this never could.
            if (clipboard.types.includes("text/html")) return false;

            const text = clipboard.getData("text/plain");
            if (!text || !looksLikeMarkdown(text)) return false;
            if (isVerbatimContext(view.state)) return false;

            event.preventDefault();
            editor.commands.insertContent(text, { contentType: "markdown" });
            return true;
          },
        },
      }),
    ];
  },
});
