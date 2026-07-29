import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/I18nProvider";
import { RowActionsMenu } from "./RowActionsMenu";
import { DeleteWorkDialog } from "./DeleteWorkDialog";

/** The `⋯` menu for one row of the works list, and the delete confirmation. */
export function WorkRowActions({ workId, workTitle }: { workId: string; workTitle: string }) {
  const { t } = useI18n();
  // The dialog is a sibling of the menu, not a child: the menu unmounts its
  // content when it closes, which would take the dialog with it.
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <RowActionsMenu label={t("workList.actions")}>
        <DropdownMenuItem render={<Link to="/admin/works/$workId/edit" params={{ workId }} />}>
          <PencilSimpleIcon className="size-4" />
          {t("workList.edit")}
        </DropdownMenuItem>
        {/* No "view" action yet, unlike the posts and notes rows: /works/$slug
            does not exist until the public-pages change, and a link to a route
            the tree has never heard of does not typecheck. It lands with that
            page, gated on `published` the same way. */}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
          <TrashIcon className="size-4" />
          {t("deleteWork.delete")}
        </DropdownMenuItem>
      </RowActionsMenu>

      <DeleteWorkDialog
        workId={workId}
        workTitle={workTitle}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
