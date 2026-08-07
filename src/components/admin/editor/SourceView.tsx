import { useMemo, useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { createLowlight } from "lowlight";
import markdownGrammar from "highlight.js/lib/languages/markdown";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Read-only view of the markdown the editor is about to save.
 *
 * Deliberately not a second editing mode. The editor has one writable surface,
 * and the whole reason the stored format is markdown is that there is exactly
 * one source of truth for a document — a second place to type into would make
 * "which side is right while both are open" a real question. What was missing
 * is only the ability to *look*: to check what a construct actually serialized
 * to, or to copy the source out.
 *
 * It takes the writing surface's place rather than opening beside it (it used
 * to be a sheet). Same column, same width, same font as the document it is
 * showing — a 2xl panel over the top of the editor gave long markdown lines a
 * third of the width they are written at, which is what made it hard to read,
 * and put its copy button under the sheet's own close button.
 */
export function SourceView({ markdown }: { markdown: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  // Highlighting is the other half of "readable": unhighlighted markdown is a
  // wall of punctuation, and the point of opening this pane is to pick a `##`
  // or a fence out of it. Memoised because the pane re-renders on every
  // keystroke the form echoes back, while the source it is showing rarely
  // changes by more than a character.
  const highlighted = useMemo(() => tokens(highlight(markdown)), [markdown]);

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    // `tm-code` is what themes the hljs token classes and the <pre> chrome —
    // the same class the writable surface carries, so the source reads in the
    // site's own code styling rather than a second opinion on it.
    <div className="tm-code">
      {/* Chrome above the block, matching a code block's own card: the label
          says the pane is read-only (the toolbar toggle is the way back), and
          copy sits at the end of it with nothing to overlap. */}
      <div className="flex items-center gap-2 border border-b-0 border-tm-border bg-tm-soft px-2 py-1">
        <span className="text-xs text-muted-foreground">{t("editor.sourceReadOnly")}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          onClick={handleCopy}
          title={copied ? t("editor.codeCopied") : t("editor.codeCopy")}
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </Button>
      </div>

      {/* `whitespace-pre-wrap` rather than a horizontal scrollbar: markdown
          lines are prose, and wrapping is how they are read. */}
      <pre className="min-h-[60vh] whitespace-pre-wrap break-words">
        <code>{highlighted}</code>
      </pre>
    </div>
  );
}

// Only the markdown grammar, not the fence languages: this pane highlights the
// document *as markdown source*, so a ```python block is one `hljs-code` span
// here — the same text it is in the file. Highlighting inside the fence would
// mean this pane and the code block card disagreed about what a fence is.
const lowlight = createLowlight({ markdown: markdownGrammar });

/**
 * What a highlighter emits: text, and `<span>`s carrying hljs class names.
 *
 * hast's own `RootContent` is the whole document vocabulary — comments,
 * doctypes, an `Element` whose `className` may be a string, a number or absent.
 * lowlight can produce none of that: it wraps slices of the input in spans it
 * builds itself. Saying so once here is what the assertion below is for;
 * re-checking it per node instead only ever produced branches nothing could
 * take, and a fallback for a shape that would already have been a bug.
 */
type Token =
  | { type: "text"; value: string }
  | { type: "element"; properties: { className: string[] }; children: Token[] };

function highlight(markdown: string): Token[] {
  return lowlight.highlight("markdown", markdown).children as unknown as Token[];
}

/**
 * hast → React. Rendering the tree as elements keeps every character in the DOM
 * as text, where `dangerouslySetInnerHTML` would put the document's own
 * markdown through an HTML parser to get back what we already have.
 */
function tokens(nodes: Token[]): React.ReactNode {
  return nodes.map((node, index) =>
    node.type === "text" ? (
      node.value
    ) : (
      // Index keys: this list is derived from the markdown and re-created
      // whole whenever it changes, so there is no identity to preserve.
      <span key={index} className={node.properties.className.join(" ")}>
        {tokens(node.children)}
      </span>
    ),
  );
}
