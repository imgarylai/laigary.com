import type { Editor } from "@tiptap/react";
import { PaletteIcon } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

const COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#0d9488",
];

export function ColorPickerPopover({ editor }: { editor: Editor }) {
  const { t } = useI18n();
  const currentColor = editor.getAttributes("textStyle").color as string | undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            title={t("editor.textColor")}
          />
        }
      >
        <div className="flex flex-col items-center gap-0.5">
          <PaletteIcon className="size-3.5" />
          <div
            className="h-0.5 w-3.5 rounded-full"
            style={{ backgroundColor: currentColor || "currentColor" }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-4 gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="size-6 rounded-sm border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              onClick={() => editor.chain().focus().setColor(color).run()}
              title={color}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 w-full text-xs"
          onClick={() => editor.chain().focus().unsetColor().run()}
        >
          {t("editor.clearColor")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
