import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowSquareOutIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/I18nProvider";
import { RowActionsMenu } from "./RowActionsMenu";
import { DeletePostDialog } from "./DeletePostDialog";

/** The `⋯` menu for one row of the posts list, and the delete confirmation. */
export function PostRowActions({
  postId,
  postSlug,
  postTitle,
  published,
}: {
  postId: string;
  postSlug: string;
  postTitle: string;
  published: boolean;
}) {
  const { t } = useI18n();
  // The dialog is a sibling of the menu, not a child: the menu unmounts its
  // content when it closes, which would take the dialog with it.
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <RowActionsMenu label={t("postList.actions")}>
        <DropdownMenuItem render={<Link to="/admin/posts/$postId/edit" params={{ postId }} />}>
          <PencilSimpleIcon className="size-4" />
          {t("postList.edit")}
        </DropdownMenuItem>
        {/* Drafts have no public page to view. */}
        {published && (
          <DropdownMenuItem
            render={
              <Link
                to="/posts/$slug"
                params={{ slug: postSlug }}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ArrowSquareOutIcon className="size-4" />
            {t("postList.view")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
          <TrashIcon className="size-4" />
          {t("deletePost.delete")}
        </DropdownMenuItem>
      </RowActionsMenu>

      <DeletePostDialog
        postId={postId}
        postTitle={postTitle}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
