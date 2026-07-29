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
import { deleteWorkFn } from "@/server/admin/works";

/**
 * Confirmation for deleting a work. Controlled, and carrying no trigger of its
 * own: the row's `⋯` menu opens it, and a trigger nested inside that menu would
 * be unmounted by the menu closing before the dialog could take over.
 */
export function DeleteWorkDialog({
  workId,
  workTitle,
  open,
  onOpenChange,
}: {
  workId: string;
  workTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteWorkFn({ data: { id: workId } });
    setDeleting(false);
    if (!result.ok) {
      toast.error(t("deleteWork.deleteFailed"));
      return;
    }
    toast.success(t("deleteWork.workDeleted"));
    onOpenChange(false);
    // Re-run the list loader so the deleted row disappears.
    router.invalidate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteWork.deleteWork")}</DialogTitle>
          <DialogDescription>
            {t("deleteWork.confirmMessage", { title: workTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("deleteWork.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? t("deleteWork.deleting") : t("deleteWork.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
