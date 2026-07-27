import { memo } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  ColumnsPlusLeftIcon,
  ColumnsPlusRightIcon,
  MinusIcon,
  RowsPlusBottomIcon,
  RowsPlusTopIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Row, column and delete controls, next to the table you are editing (#197).
 *
 * These commands already existed and worked — they were just in the toolbar,
 * behind an unlabelled icon, greyed out until the caret happened to be in a
 * table, which is the moment you have already stopped looking there. Reported
 * as "I could not see how to add row and col", and separately "how to delete
 * it". Nothing about the commands changes here; only where you find them.
 *
 * Same move as #170 made for the code block: put the controls on the thing.
 */
export const TableBubbleMenu = memo(function TableBubbleMenu({ editor }: { editor: Editor }) {
  const { t } = useI18n();

  const actions = [
    {
      key: "addRowBefore",
      icon: RowsPlusTopIcon,
      run: () => editor.chain().focus().addRowBefore().run(),
    },
    {
      key: "addRowAfter",
      icon: RowsPlusBottomIcon,
      run: () => editor.chain().focus().addRowAfter().run(),
    },
    { key: "deleteRow", icon: MinusIcon, run: () => editor.chain().focus().deleteRow().run() },
    { separator: true },
    {
      key: "addColumnBefore",
      icon: ColumnsPlusLeftIcon,
      run: () => editor.chain().focus().addColumnBefore().run(),
    },
    {
      key: "addColumnAfter",
      icon: ColumnsPlusRightIcon,
      run: () => editor.chain().focus().addColumnAfter().run(),
    },
    {
      key: "deleteColumn",
      icon: MinusIcon,
      run: () => editor.chain().focus().deleteColumn().run(),
    },
    { separator: true },
    {
      key: "deleteTable",
      icon: TrashIcon,
      destructive: true,
      run: () => editor.chain().focus().deleteTable().run(),
    },
  ] as const;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubbleMenu"
      // Asks the editor at call time. The trap here is capturing a derived
      // value instead — a `useEditorState` boolean, say: the plugin evaluates
      // this during the ProseMirror transaction, before React has re-rendered,
      // so the menu reads one transaction stale and never opens on the
      // transaction that actually created the table. (Reading the `editor` prop
      // directly would be equivalent; it is the same instance.)
      shouldShow={({ editor: e }) => e.isActive("table")}
      options={{ placement: "top", offset: 8 }}
      // Unlike the `/` menu, this className lands on the element the plugin
      // positions, so the stacking works from here (#196 is the cautionary
      // tale: there it sat on a static child and did nothing).
      className="z-50 flex items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md"
    >
      {actions.map((action, i) =>
        "separator" in action ? (
          <Separator key={`sep-${i}`} orientation="vertical" className="mx-0.5 h-5" />
        ) : (
          <Button
            key={action.key}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t(`editor.${action.key}`)}
            title={t(`editor.${action.key}`)}
            onClick={action.run}
            className={"destructive" in action ? "text-destructive" : undefined}
          >
            <action.icon className="size-4" />
          </Button>
        ),
      )}
    </BubbleMenu>
  );
});
