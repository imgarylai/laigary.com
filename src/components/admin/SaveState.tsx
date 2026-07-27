import { CheckIcon, CircleIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Whether what is on screen matches what is stored, shown next to the save
 * action in the editor's sticky bar (#177).
 *
 * Until now nothing said this at all: there is no autosave, so an author who
 * assumed there was could close the tab and lose everything. The dot is the
 * point — it is the only thing on the page that distinguishes a saved draft
 * from an unsaved one.
 *
 * `aria-live` because the state changes without anyone touching this element:
 * it flips to "unsaved" on the first keystroke and back on save.
 */
export function SaveState({
  dirty,
  saving,
  /** Whether a stored version exists at all — false on a post being created,
   *  where "Saved" would be a lie until the first save. */
  saved,
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
}) {
  const { t } = useI18n();

  const content = saving ? (
    <>
      <SpinnerIcon className="size-3 animate-spin" />
      {t("postForm.saving")}
    </>
  ) : dirty ? (
    <>
      <CircleIcon className="size-2.5" weight="fill" />
      {t("postForm.unsavedChanges")}
    </>
  ) : saved ? (
    <>
      <CheckIcon className="size-3" />
      {t("postForm.allSaved")}
    </>
  ) : null;

  return (
    <span
      aria-live="polite"
      className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground"
    >
      {content}
    </span>
  );
}
