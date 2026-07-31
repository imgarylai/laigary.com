import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowSquareOutIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/I18nProvider";
import { RowActionsMenu } from "./RowActionsMenu";
import { DeletePageDialog } from "./DeletePageDialog";

/**
 * The `⋯` menu for one row of the pages list, and the delete confirmation.
 *
 * Pages have no draft state, so unlike posts and works the view item is always
 * shown — every page has a public URL.
 */
export function PageRowActions({ pageSlug, pageTitle }: { pageSlug: string; pageTitle: string }) {
  const { t } = useI18n();
  // The dialog is a sibling of the menu, not a child: the menu unmounts its
  // content when it closes, which would take the dialog with it.
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <RowActionsMenu label={t("pageList.actions")}>
        <DropdownMenuItem
          render={<Link to="/admin/pages/$slug/edit" params={{ slug: pageSlug }} />}
        >
          <PencilSimpleIcon className="size-4" />
          {t("pageList.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link to="/$slug" params={{ slug: pageSlug }} target="_blank" rel="noreferrer" />}
        >
          <ArrowSquareOutIcon className="size-4" />
          {t("pageList.view")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
          <TrashIcon className="size-4" />
          {t("deletePage.delete")}
        </DropdownMenuItem>
      </RowActionsMenu>

      <DeletePageDialog
        pageSlug={pageSlug}
        pageTitle={pageTitle}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
