import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
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
import { deleteNoteFn } from "@/server/admin/interview";

/**
 * Confirmation for deleting a note. Controlled and trigger-less for the same
 * reason as DeletePostDialog — the row's `⋯` menu opens it, and a trigger inside
 * that menu would unmount as the menu closed.
 */
export function DeleteNoteDialog({
  noteId,
  noteTitle,
  open,
  onOpenChange,
}: {
  noteId: string;
  noteTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteNoteFn({ data: { id: noteId } });
    setDeleting(false);
    if (!result.ok) {
      toast.error(t("noteList.deleteFailed"));
      return;
    }
    toast.success(t("admin.noteDeleted"));
    onOpenChange(false);
    router.invalidate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("noteList.deleteTitle")}</DialogTitle>
          <DialogDescription>{t("noteList.deleteConfirm", { title: noteTitle })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("noteForm.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? t("noteList.deleting") : t("noteList.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
