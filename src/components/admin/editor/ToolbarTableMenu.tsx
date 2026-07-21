import type { Editor } from "@tiptap/react";
import { TableIcon } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

export function ToolbarTableMenu({ editor }: { editor: Editor }) {
  const { t } = useI18n();
  const inTable = editor.isActive("table");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={inTable ? "secondary" : "ghost"}
            size="icon"
            className="size-7"
            title={t("editor.table")}
          />
        }
      >
        <TableIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          disabled={inTable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
        >
          {t("editor.insertTable")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().addRowBefore().run()}
        >
          {t("editor.addRowBefore")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          {t("editor.addRowAfter")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          {t("editor.deleteRow")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        >
          {t("editor.addColumnBefore")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          {t("editor.addColumnAfter")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!inTable}
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          {t("editor.deleteColumn")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!inTable}
          variant="destructive"
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          {t("editor.deleteTable")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
