import type { Editor } from "@tiptap/react";
import { useI18n } from "@/i18n/I18nProvider";

export function CharacterCount({ editor }: { editor: Editor }) {
  const { t } = useI18n();
  const chars = editor.storage.characterCount.characters();
  const words = editor.storage.characterCount.words();

  return (
    <div className="flex items-center gap-3 border-t px-4 py-1.5 text-xs text-muted-foreground">
      <span>
        {chars} {t("editor.characters")}
      </span>
      <span>
        {words} {t("editor.words")}
      </span>
    </div>
  );
}
