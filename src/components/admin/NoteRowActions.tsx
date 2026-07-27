import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowSquareOutIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/I18nProvider";
import { RowActionsMenu } from "./RowActionsMenu";
import { DeleteNoteDialog } from "./DeleteNoteDialog";

/** The `⋯` menu for one row of the notes list, and the delete confirmation. */
export function NoteRowActions({
  noteId,
  noteSlug,
  noteTitle,
  sectionSlug,
  published,
}: {
  noteId: string;
  noteSlug: string;
  noteTitle: string;
  sectionSlug: string;
  published: boolean;
}) {
  const { t } = useI18n();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <RowActionsMenu label={t("noteList.actions")}>
        <DropdownMenuItem
          render={<Link to="/admin/interview/notes/$noteId/edit" params={{ noteId }} />}
        >
          <PencilSimpleIcon className="size-4" />
          {t("postList.edit")}
        </DropdownMenuItem>
        {published && (
          <DropdownMenuItem
            render={
              <Link
                to="/interview/$section/$slug"
                params={{ section: sectionSlug, slug: noteSlug }}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ArrowSquareOutIcon className="size-4" />
            {t("noteList.view")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
          <TrashIcon className="size-4" />
          {t("noteList.delete")}
        </DropdownMenuItem>
      </RowActionsMenu>

      <DeleteNoteDialog
        noteId={noteId}
        noteTitle={noteTitle}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
