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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/I18nProvider";
import { deleteNoteFn } from "@/server/admin/interview";

export function DeleteNoteButton({ noteId, noteTitle }: { noteId: string; noteTitle: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    router.invalidate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        {t("noteList.delete")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("noteList.deleteTitle")}</DialogTitle>
          <DialogDescription>{t("noteList.deleteConfirm", { title: noteTitle })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
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
