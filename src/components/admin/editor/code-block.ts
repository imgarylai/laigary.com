import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import { INDENT_UNIT, outdentWidth, selectedLineStarts, spansMultipleLines } from "./code-indent";

/** The code block the cursor is inside, with the document position its text
 *  content starts at — or null when the selection is elsewhere. */
function activeCodeBlock(state: EditorState, name: string) {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === name) {
      return { node, contentStart: $from.start(depth) };
    }
  }

  return null;
}

/**
 * Code block with code-shaped key semantics.
 *
 * ProseMirror leaves Tab to the browser for accessibility, and the editor is
 * mounted inside a <form> — so pressing Tab while writing Python moved focus to
 * the submit button and you left the article (#171). Inside a code block, keys
 * mean code things instead.
 *
 * The node's schema, markdown mapping and lowlight highlighting are untouched.
 */
export const CodeBlockCardExtension = CodeBlockLowlight.extend({
  addKeyboardShortcuts() {
    // Tab is the editor-wide escape hatch for keyboard users, so every handler
    // here returns false the moment the selection is outside a code block —
    // focus keeps moving everywhere except where indentation is the obvious
    // meaning of the key.
    const indent = (): boolean => {
      const { state, view } = this.editor;
      const block = activeCodeBlock(state, this.name);
      if (!block) return false;

      const text = block.node.textContent;
      const { from, to } = state.selection;
      const relFrom = from - block.contentStart;
      const relTo = to - block.contentStart;
      const tr: Transaction = state.tr;

      if (!spansMultipleLines(text, relFrom, relTo)) {
        // Plain cursor (or a selection within one line): behave like typing.
        tr.insertText(INDENT_UNIT, from, to);
      } else {
        // Walk the line starts backwards so each insertion leaves the offsets
        // of the lines above it untouched.
        const starts = selectedLineStarts(text, relFrom, relTo);
        for (const start of [...starts].reverse()) {
          tr.insertText(INDENT_UNIT, block.contentStart + start);
        }
      }

      view.dispatch(tr);
      return true;
    };

    const outdent = (): boolean => {
      const { state, view } = this.editor;
      const block = activeCodeBlock(state, this.name);
      if (!block) return false;

      const text = block.node.textContent;
      const { from, to } = state.selection;
      const starts = selectedLineStarts(text, from - block.contentStart, to - block.contentStart);
      const tr: Transaction = state.tr;
      let removed = false;

      for (const start of [...starts].reverse()) {
        const width = outdentWidth(text, start);
        if (width === 0) continue;
        const at = block.contentStart + start;
        tr.delete(at, at + width);
        removed = true;
      }

      // Swallow the key even with nothing to remove: an already-flush line
      // should stay put, not hand Tab back and blur the editor.
      if (removed) view.dispatch(tr);
      return true;
    };

    return {
      Tab: indent,
      "Shift-Tab": outdent,
      // Explicit way out that works anywhere in the block, not just from its
      // last line (ArrowDown already handles that case).
      "Mod-Enter": () => {
        const { state } = this.editor;
        if (!activeCodeBlock(state, this.name)) return false;
        return this.editor.commands.exitCode();
      },
      // An empty code block should give way to a paragraph rather than trap the
      // cursor: Backspace at its start lifts it.
      Backspace: () => {
        const { state } = this.editor;
        const block = activeCodeBlock(state, this.name);
        if (!block) return false;

        const { empty, $from } = state.selection;
        if (!empty || $from.parentOffset !== 0) return false;
        if (block.node.textContent.length > 0) return false;

        return this.editor.commands.clearNodes();
      },
    };
  },
});
