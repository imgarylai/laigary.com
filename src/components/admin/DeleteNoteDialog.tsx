import { useI18n } from "@/i18n/I18nProvider";
import { deleteNoteFn } from "@/server/admin/interview";
import { DeleteContentDialog } from "./DeleteContentDialog";

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
  const { t } = useI18n();

  return (
    <DeleteContentDialog
      open={open}
      onOpenChange={onOpenChange}
      onDelete={() => deleteNoteFn({ data: { id: noteId } })}
      labels={{
        title: t("noteList.deleteTitle"),
        description: t("noteList.deleteConfirm", { title: noteTitle }),
        cancel: t("noteForm.cancel"),
        confirm: t("noteList.delete"),
        pending: t("noteList.deleting"),
        success: t("admin.noteDeleted"),
        failure: t("noteList.deleteFailed"),
      }}
    />
  );
}
