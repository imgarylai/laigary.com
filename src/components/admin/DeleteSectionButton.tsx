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
import { deleteSectionFn } from "@/server/admin/interview";

// Deleting a section cascades to every note under it (FK onDelete: cascade), so
// warn with the note count before removing.
export function DeleteSectionButton({
  section,
}: {
  section: { id: string; label: string; noteCount: number };
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteSectionFn({ data: { id: section.id } });
    setDeleting(false);
    if (!result.ok) {
      toast.error(t("admin.sectionDeleteFailed"));
      return;
    }
    toast.success(t("admin.sectionDeleted"));
    setOpen(false);
    router.invalidate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        {t("sectionList.delete")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sectionList.deleteTitle", { label: section.label })}</DialogTitle>
          <DialogDescription>
            {section.noteCount > 0
              ? t("sectionList.deleteCascade", { count: String(section.noteCount) })
              : t("sectionList.deleteEmpty")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("sectionForm.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? t("sectionList.deleting") : t("sectionList.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
