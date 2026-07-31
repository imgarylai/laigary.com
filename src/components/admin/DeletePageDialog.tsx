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
import { deletePageFn } from "@/server/admin/pages";

/**
 * Confirmation for deleting a page. Controlled, and carrying no trigger of its
 * own: the row's `⋯` menu opens it, and a trigger nested inside that menu would
 * be unmounted by the menu closing before the dialog could take over.
 *
 * Keyed by slug rather than id — that is how the page routes and the upsert
 * address a page.
 */
export function DeletePageDialog({
  pageSlug,
  pageTitle,
  open,
  onOpenChange,
}: {
  pageSlug: string;
  pageTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deletePageFn({ data: { slug: pageSlug } });
    setDeleting(false);
    if (!result.ok) {
      toast.error(t("deletePage.deleteFailed"));
      return;
    }
    toast.success(t("deletePage.pageDeleted"));
    onOpenChange(false);
    // Re-run the list loader so the deleted row disappears.
    router.invalidate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deletePage.deletePage")}</DialogTitle>
          <DialogDescription>
            {t("deletePage.confirmMessage", { title: pageTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("deletePage.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? t("deletePage.deleting") : t("deletePage.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
