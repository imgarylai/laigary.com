import { useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { AUTO, CodeLanguagePicker } from "./CodeLanguagePicker";

// A code block's language used to be writable only by the markdown input rule,
// at creation time. Nothing displayed it and nothing could change it, so a
// fence tagged wrong (or not at all) had to be deleted and retyped. This header
// makes `language` an ordinary editable attribute.

export function CodeBlockCard({ node, updateAttributes, editor }: NodeViewProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const language = (node.attrs.language as string | null) ?? AUTO;

  async function handleCopy() {
    await navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <NodeViewWrapper className="group relative my-4">
      {/* contentEditable={false} keeps ProseMirror out of the chrome: without it
          the header counts as node content and the caret can land in it. */}
      <div
        contentEditable={false}
        className="flex items-center gap-1 border border-b-0 border-tm-border bg-tm-soft px-2 py-1"
      >
        <CodeLanguagePicker
          value={language}
          onChange={(next) => {
            updateAttributes({ language: next === AUTO ? null : next });
            // The trigger keeps focus after a pick; hand it back to the code so
            // typing continues where the author was working.
            editor.commands.focus();
          }}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          onClick={handleCopy}
          title={copied ? t("editor.codeCopied") : t("editor.codeCopy")}
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </Button>
      </div>

      {/* <pre><code> is what terminal.css styles and what the published page
          renders, so the card body stays byte-comparable with the real thing. */}
      {/* NodeViewContent blocks inference from `as` (NoInfer), so the element
          type is supplied explicitly rather than cast. */}
      <pre className="!mt-0">
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
