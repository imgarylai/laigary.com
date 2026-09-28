import { useI18n } from "@/i18n/I18nProvider";
import { deletePageFn } from "@/server/admin/pages";
import { DeleteContentDialog } from "./DeleteContentDialog";

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
  const { t } = useI18n();

  return (
    <DeleteContentDialog
      open={open}
      onOpenChange={onOpenChange}
      onDelete={() => deletePageFn({ data: { slug: pageSlug } })}
      labels={{
        title: t("deletePage.deletePage"),
        description: t("deletePage.confirmMessage", { title: pageTitle }),
        cancel: t("deletePage.cancel"),
        confirm: t("deletePage.delete"),
        pending: t("deletePage.deleting"),
        success: t("deletePage.pageDeleted"),
        failure: t("deletePage.deleteFailed"),
      }}
    />
  );
}
