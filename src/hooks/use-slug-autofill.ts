import { useCallback, useRef } from "react";
import { slugify } from "@/lib/slug";

/**
 * Keep a new record's slug in step with its title, for as long as the author
 * hasn't taken the slug over themselves.
 *
 * The obvious guard — `!formState.dirtyFields.slug` — does not work, and used
 * to freeze the slug two keystrokes in: "十年部落格如一日" saved as "shih".
 * `setValue` without `shouldDirty` really doesn't mark the field
 * dirty, but the *next* keystroke in the title does: react-hook-form's
 * `updateTouchAndDirty` re-diffs the WHOLE form against `defaultValues`
 * (`getDirtyFields(_defaultValues, _formValues)`) whenever a field's pristine
 * state and the form's `isDirty` disagree. The auto-filled slug differs from
 * its `""` default, so it comes back marked dirty and the guard latches shut —
 * one render late, which is why exactly the first two keystrokes got through.
 *
 * So track authorship instead of dirtiness: remember the last slug we wrote,
 * and stand down as soon as the field holds anything else.
 *
 * @param enabled  false in edit mode — an existing record's slug is its public
 *                 URL and must never be rewritten from the title.
 * @param getSlug  reads the slug field's current value.
 * @param setSlug  writes the slug field.
 */
export function useSlugAutofill({
  enabled,
  getSlug,
  setSlug,
}: {
  enabled: boolean;
  getSlug: () => string;
  setSlug: (slug: string) => void;
}) {
  // The callbacks close over this render's props, but `fromTitle` is handed to
  // an input that can outlive several renders the form never re-rendered for.
  // Reading them through a ref keeps the returned handlers stable AND current —
  // a stale closure is the other half of how this went wrong.
  const latest = useRef({ enabled, getSlug, setSlug });
  latest.current = { enabled, getSlug, setSlug };

  // The last slug this hook wrote. Anything else in the field is the author's.
  const autoFilled = useRef("");
  const stoppedRef = useRef(false);

  const fromTitle = useCallback((title: string) => {
    const { enabled, getSlug, setSlug } = latest.current;
    if (!enabled || stoppedRef.current) return;

    // Not what we last wrote (including a slug typed before the title) — the
    // author owns it now, and every later title edit leaves it alone.
    if (getSlug() !== autoFilled.current) {
      stoppedRef.current = true;
      return;
    }

    const next = slugify(title);
    autoFilled.current = next;
    setSlug(next);
  }, []);

  /** Stop auto-filling for good — call once the record has been saved. */
  const stop = useCallback(() => {
    stoppedRef.current = true;
  }, []);

  /** Back to a blank slate, for a form that is reused for the next new record. */
  const reset = useCallback(() => {
    autoFilled.current = "";
    stoppedRef.current = false;
  }, []);

  return { fromTitle, stop, reset };
}
