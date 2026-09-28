import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { deleteSectionFn } from "@/server/admin/interview";
import { DeleteContentDialog } from "./DeleteContentDialog";

// Deleting a section cascades to every note under it (FK onDelete: cascade), so
// warn with the note count before removing.
export function DeleteSectionButton({
  section,
}: {
  section: { id: string; label: string; noteCount: number };
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <DeleteContentDialog
      open={open}
      onOpenChange={setOpen}
      onDelete={() => deleteSectionFn({ data: { id: section.id } })}
      trigger={t("sectionList.delete")}
      labels={{
        title: t("sectionList.deleteTitle", { label: section.label }),
        description:
          section.noteCount > 0
            ? t("sectionList.deleteCascade", { count: String(section.noteCount) })
            : t("sectionList.deleteEmpty"),
        cancel: t("sectionForm.cancel"),
        confirm: t("sectionList.delete"),
        pending: t("sectionList.deleting"),
        success: t("admin.sectionDeleted"),
        failure: t("admin.sectionDeleteFailed"),
      }}
    />
  );
}
