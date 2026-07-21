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
import { deletePostFn } from "@/server/admin/posts";

export function DeletePostButton({ postId, postTitle }: { postId: string; postTitle: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    // Re-run the list loader so the deleted row disappears.
    router.invalidate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        {t("deletePost.delete")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deletePost.deletePost")}</DialogTitle>
          <DialogDescription>
            {t("deletePost.confirmMessage", { title: postTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
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
