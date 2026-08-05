import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
 * A sheet rather than a third column, because the editor and preview already
 * split the width and the source is something you open, read, and close.
 */
export function SourceSheet({
  markdown,
  open,
  onOpenChange,
}: {
  markdown: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <SheetTitle>{t("editor.viewSource")}</SheetTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title={copied ? t("editor.codeCopied") : t("editor.codeCopy")}
          >
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          </Button>
        </SheetHeader>

        {/* `whitespace-pre-wrap` rather than a horizontal scrollbar: markdown
            lines are prose, and wrapping is how they are read. */}
        <pre className="mx-4 mb-8 min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-tm-soft p-3 text-xs leading-relaxed">
          {markdown}
        </pre>
      </SheetContent>
    </Sheet>
  );
}
