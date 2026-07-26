import { useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { CODE_LANGUAGE_OPTIONS, PLAIN_LANGUAGE } from "@/lib/code-languages";

// A code block's language used to be writable only by the markdown input rule,
// at creation time. Nothing displayed it and nothing could change it, so a
// fence tagged wrong (or not at all) had to be deleted and retyped. This header
// makes `language` an ordinary editable attribute.
//
// `auto` is the UI name for language = null: an untagged fence, which both the
// editor and the renderer auto-detect. That is genuinely different from `text`,
// which asks for no highlighting at all — so both are offered rather than
// collapsing them into one "none".
const AUTO = "auto";

export function CodeBlockCard({ node, updateAttributes, editor }: NodeViewProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const language = (node.attrs.language as string | null) ?? AUTO;

  function labelFor(value: string): string {
    if (value === AUTO) return t("editor.codeLanguageAuto");
    if (value === PLAIN_LANGUAGE) return t("editor.codeLanguagePlain");
    return CODE_LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }

  // Content written before this list existed (or by a hand-typed fence) can name
  // a language the picker doesn't offer. Surface it as its own option instead of
  // silently rewriting the author's fence to something else.
  const options = [
    { value: AUTO, label: labelFor(AUTO) },
    ...CODE_LANGUAGE_OPTIONS.map((o) => ({ value: o.value, label: labelFor(o.value) })),
  ];
  if (!options.some((o) => o.value === language)) {
    options.push({ value: language, label: language });
  }

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
        <Select
          value={language}
          onValueChange={(value) => {
            updateAttributes({ language: value === AUTO ? null : value });
            // The trigger keeps focus after a pick; hand it back to the code so
            // typing continues where the author was working.
            editor.commands.focus();
          }}
          items={options}
        >
          <SelectTrigger
            size="sm"
            className="h-6 w-auto min-w-32 border-0 bg-transparent text-xs shadow-none"
            aria-label={t("editor.codeLanguage")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
