import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Youtube from "@tiptap/extension-youtube";
import CharacterCount from "@tiptap/extension-character-count";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Focus from "@tiptap/extension-focus";
import { InlineMath } from "./inline-math";
import { LinkSuggestion } from "./link-suggestion";
import { CodeBlockCardExtension } from "./code-block";
import { createSlashSuggestion, type SlashDialogs } from "./slash-suggestion";
import { createLowlight } from "lowlight";
import { CODE_LANGUAGE_GRAMMARS } from "@/lib/code-languages";

// Exactly the grammars lib/markdown.ts can auto-detect into — NOT lowlight's
// `common` bundle. Both sides run highlightAuto on an untagged fence, so a
// grammar registered here but absent there (or the reverse) would make the same
// block resolve to different languages while writing vs once published.
//
// This buys correctness, not bytes: rehype-highlight still pulls `common` into
// the same chunk (the preview imports lib/markdown), so the editor bundle is
// unchanged at ~1.61 MB. Measured, because the opposite is easy to assume.
const lowlight = createLowlight(CODE_LANGUAGE_GRAMMARS);

/** No-op dialogs, for callers that only need the schema (tests, and anything
 *  rendering content without the editor's React tree around it). */
const NO_DIALOGS: SlashDialogs = { openImage: () => {}, openYouTube: () => {} };

export function createExtensions({
  placeholder,
  dialogs = NO_DIALOGS,
}: {
  placeholder: string;
  /** Lets `/image` and `/youtube` reach the dialogs TiptapEditorImpl owns. */
  dialogs?: SlashDialogs;
}) {
  return [
    StarterKit.configure({ codeBlock: false, link: false, underline: false }),
    CodeBlockCardExtension.configure({ lowlight }),
    Link.configure({ openOnClick: false }),
    Underline,
    Image,
    Markdown,
    Placeholder.configure({ placeholder }),
    // Keep the harmless typographic replacements (em-dash, ellipsis, arrows, …)
    // but turn OFF smart quotes. Straight ' and " were being auto-rewritten to
    // paired curly quotes ('…' / "…"), which changes the character you typed and
    // leaks U+2018/2019/201C/201D into the Markdown output — undesirable in a
    // Markdown/dev editor where quotes often sit inside code or technical text.
    Typography.configure({
      openSingleQuote: false,
      closeSingleQuote: false,
      openDoubleQuote: false,
      closeDoubleQuote: false,
    }),
    Highlight,
    Subscript,
    Superscript,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader,
    Youtube.configure({ inline: false }),
    CharacterCount,
    TextStyle,
    Color,
    Focus.configure({ className: "has-focus", mode: "deepest" }),
    // `@` article mention → inserts a plain markdown link (see link-suggestion.tsx).
    LinkSuggestion,
    // `/` block-insert menu (see slash-suggestion.tsx).
    createSlashSuggestion(dialogs),
    // InlineMath = @aarkue InlineMathNode + markdown mapping (see inline-math.ts).
    // Registered directly instead of via MathExtension, which is only a thin
    // wrapper that would add the unextended node.
    InlineMath.configure({ evaluation: false }),
  ];
}
