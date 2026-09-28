import { useI18n } from "@/i18n/I18nProvider";
import { deletePostFn } from "@/server/admin/posts";
import { DeleteContentDialog } from "./DeleteContentDialog";

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
  const { t } = useI18n();

  return (
    <DeleteContentDialog
      open={open}
      onOpenChange={onOpenChange}
      onDelete={() => deletePostFn({ data: { id: postId } })}
      labels={{
        title: t("deletePost.deletePost"),
        description: t("deletePost.confirmMessage", { title: postTitle }),
        cancel: t("deletePost.cancel"),
        confirm: t("deletePost.delete"),
        pending: t("deletePost.deleting"),
        success: t("deletePost.postDeleted"),
        failure: t("deletePost.deleteFailed"),
      }}
    />
  );
}
