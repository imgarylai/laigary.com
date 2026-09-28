import { useI18n } from "@/i18n/I18nProvider";
import { deleteWorkFn } from "@/server/admin/works";
import { DeleteContentDialog } from "./DeleteContentDialog";

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
  const { t } = useI18n();

  return (
    <DeleteContentDialog
      open={open}
      onOpenChange={onOpenChange}
      onDelete={() => deleteWorkFn({ data: { id: workId } })}
      labels={{
        title: t("deleteWork.deleteWork"),
        description: t("deleteWork.confirmMessage", { title: workTitle }),
        cancel: t("deleteWork.cancel"),
        confirm: t("deleteWork.delete"),
        pending: t("deleteWork.deleting"),
        success: t("deleteWork.workDeleted"),
        failure: t("deleteWork.deleteFailed"),
      }}
    />
  );
}
