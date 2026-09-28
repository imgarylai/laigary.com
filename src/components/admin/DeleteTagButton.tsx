import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { deleteTagFn } from "@/server/admin/tags";
import { DeleteContentDialog } from "./DeleteContentDialog";

// Deleting a tag also drops its post/note/work associations (junction rows).
// Warn when the tag is still in use so it isn't removed by accident.
type UsedBy = { type: "post" | "note" | "work"; title: string; slug: string };

export function DeleteTagButton({
  tag,
}: {
  tag: {
    id: string;
    name: string;
    postCount: number;
    noteCount: number;
    workCount: number;
    usedBy: UsedBy[];
  };
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const usage = tag.postCount + tag.noteCount + tag.workCount;

  return (
    <DeleteContentDialog
      open={open}
      onOpenChange={setOpen}
      onDelete={() => deleteTagFn({ data: { id: tag.id } })}
      trigger={t("tagList.delete")}
      labels={{
        title: t("admin.deleteTagTitle", { name: tag.name }),
        description:
          usage > 0
            ? t("admin.deleteTagInUse", { count: String(usage) })
            : t("admin.deleteTagUnused"),
        cancel: t("tagForm.cancel"),
        confirm: t("tagList.delete"),
        pending: t("tagList.deleting"),
        success: t("admin.tagDeleted"),
        failure: t("admin.tagDeleteFailed"),
      }}
    >
      {usage > 0 && (
        <ul className="max-h-40 list-disc space-y-1 overflow-auto pl-5 text-xs text-muted-foreground">
          {tag.usedBy.map((item) => (
            <li key={`${item.type}-${item.slug}`}>
              {item.title} <span className="opacity-60">({item.type})</span>
            </li>
          ))}
        </ul>
      )}
    </DeleteContentDialog>
  );
}
