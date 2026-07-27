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
import { deletePostFn } from "@/server/admin/posts";

/**
 * Confirmation for deleting a post. Controlled, and carrying no trigger of its
 * own: the row's `⋯` menu opens it (#180), and a trigger nested inside that menu
 * would be unmounted by the menu closing before the dialog could take over.
 */
export function DeletePostDialog({
  postId,
  postTitle,
  open,
  onOpenChange,
}: {
  postId: string;
  postTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deletePostFn({ data: { id: postId } });
    setDeleting(false);
    if (!result.ok) {
      toast.error(t("deletePost.deleteFailed"));
      return;
    }
    toast.success(t("deletePost.postDeleted"));
    onOpenChange(false);
    // Re-run the list loader so the deleted row disappears.
    router.invalidate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deletePost.deletePost")}</DialogTitle>
          <DialogDescription>
            {t("deletePost.confirmMessage", { title: postTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("deletePost.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? t("deletePost.deleting") : t("deletePost.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
