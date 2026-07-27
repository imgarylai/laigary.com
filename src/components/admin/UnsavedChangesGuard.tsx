import { useCallback } from "react";
import { useBlocker } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Stops an editor with unsaved changes from being abandoned by accident (#177).
 *
 * There is no autosave, so clicking a sidebar link or hitting Cancel used to
 * discard the work silently. This covers both exits: `useBlocker` for in-app
 * navigation, and its `enableBeforeUnload` for closing or reloading the tab —
 * the browser's own dialog handles that one, since a page cannot render its own
 * during unload.
 *
 * Confirmation uses `Dialog` rather than `window.confirm`, matching
 * DeletePostButton, and because a native confirm blocks the main thread and
 * looks nothing like the rest of the admin.
 */
export function UnsavedChangesGuard({
  dirty,
  /** True while a save is in flight. A create navigates to the edit route as
   *  the last step of saving, and blocking our own redirect would strand the
   *  author in a dialog asking whether to discard changes they just saved. */
  saving,
}: {
  dirty: boolean;
  saving: boolean;
}) {
  const { t } = useI18n();

  // Stable per (dirty, saving): useBlocker lists these in its effect deps, so
  // fresh identities every render would re-register the history block on each
  // one. Keeping them stable also guarantees the closure is current as of the
  // last render, which is what makes reading `dirty` here correct at all.
  const shouldBlockFn = useCallback(() => dirty && !saving, [dirty, saving]);
  const enableBeforeUnload = useCallback(() => dirty && !saving, [dirty, saving]);

  const blocker = useBlocker({ shouldBlockFn, enableBeforeUnload, withResolver: true });

  return (
    <Dialog
      open={blocker.status === "blocked"}
      // Dismissing by Escape or the backdrop means "I did not mean to leave".
      onOpenChange={(open) => {
        if (!open) blocker.reset?.();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("postForm.leaveTitle")}</DialogTitle>
          <DialogDescription>{t("postForm.leaveBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => blocker.reset?.()}>
            {t("postForm.keepEditing")}
          </Button>
          <Button type="button" variant="destructive" onClick={() => blocker.proceed?.()}>
            {t("postForm.discardChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
