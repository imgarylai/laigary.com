import { useState } from "react";
import { CaretUpDownIcon, XIcon, CheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export type TagOption = { id: string; name: string; slug: string };

export function TagsCombobox({
  options,
  value,
  onChange,
}: {
  options: TagOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const selected = options.filter((o) => value.includes(o.id));

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className="text-muted-foreground">
            {selected.length > 0
              ? t("tagsCombobox.selectedCount", { count: String(selected.length) })
              : t("tagsCombobox.placeholder")}
          </span>
          <CaretUpDownIcon className="opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) p-0" align="start">
          <Command>
            <CommandInput placeholder={t("tagsCombobox.searchPlaceholder")} />
            <CommandList>
              <CommandEmpty>{t("tagsCombobox.noResults")}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected = value.includes(opt.id);
                  return (
                    <CommandItem
                      key={opt.id}
                      value={`${opt.name} ${opt.slug}`}
                      onSelect={() => toggle(opt.id)}
                    >
                      <CheckIcon className={cn("mr-2", isSelected ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1">{opt.name}</span>
                      <span className="text-xs text-muted-foreground">{opt.slug}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
              {tag.name}
              <button
                type="button"
                onClick={() => remove(tag.id)}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-muted-foreground/20"
                aria-label={t("tagsCombobox.removeTag", { name: tag.name })}
              >
                <XIcon size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
