import { useEditorState, type Editor } from "@tiptap/react";
import { useI18n } from "@/i18n/I18nProvider";

// Subscribes through useEditorState rather than reading editor.storage during
// render. The old version only updated because the parent re-rendered on every
// keystroke — a dependency on someone else's render that would silently freeze
// the counters the moment the write path stopped doing that.
export function CharacterCount({ editor }: { editor: Editor }) {
  const { t } = useI18n();
  const { chars, words } = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      chars: e.storage.characterCount.characters() as number,
      words: e.storage.characterCount.words() as number,
    }),
  });

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
