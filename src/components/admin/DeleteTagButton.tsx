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
import { deleteTagFn } from "@/server/admin/tags";

// Deleting a tag also drops its post/note associations (junction rows). Warn
// when the tag is still in use so it isn't removed by accident.
type UsedBy = { type: "post" | "note"; title: string; slug: string };

export function DeleteTagButton({
  tag,
}: {
  tag: { id: string; name: string; postCount: number; noteCount: number; usedBy: UsedBy[] };
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const usage = tag.postCount + tag.noteCount;

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteTagFn({ data: { id: tag.id } });
    setDeleting(false);
    if (!result.ok) {
      toast.error(t("admin.tagDeleteFailed"));
      return;
    }
    toast.success(t("admin.tagDeleted"));
    setOpen(false);
    router.invalidate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        {t("tagList.delete")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.deleteTagTitle", { name: tag.name })}</DialogTitle>
          <DialogDescription>
            {usage > 0
              ? t("admin.deleteTagInUse", { count: String(usage) })
              : t("admin.deleteTagUnused")}
          </DialogDescription>
        </DialogHeader>
        {usage > 0 && (
          <ul className="max-h-40 list-disc space-y-1 overflow-auto pl-5 text-xs text-muted-foreground">
            {tag.usedBy.map((item) => (
              <li key={`${item.type}-${item.slug}`}>
                {item.title} <span className="opacity-60">({item.type})</span>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("tagForm.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? t("tagList.deleting") : t("tagList.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
