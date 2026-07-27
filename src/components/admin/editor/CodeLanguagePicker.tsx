import { useMemo, useState } from "react";
import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
import { CODE_LANGUAGE_OPTIONS, PLAIN_LANGUAGE } from "@/lib/code-languages";

/** The UI name for `language = null`: an untagged fence, which both the editor
 *  and the renderer auto-detect. Genuinely different from `text`, which asks for
 *  no highlighting at all, so both are offered rather than collapsed into one. */
export const AUTO = "auto";

export type LanguageOption = { value: string; label: string };

/**
 * The options to offer for a block currently set to `current`.
 *
 * Content written before this list existed — or by a hand-typed fence — can name
 * a language the picker does not carry. It is surfaced as its own option rather
 * than silently rewriting the author's fence to something else.
 */
export function languageOptions(current: string, labels: Record<string, string>): LanguageOption[] {
  const options: LanguageOption[] = [
    { value: AUTO, label: labels.auto },
    ...CODE_LANGUAGE_OPTIONS.map((o) => ({
      value: o.value,
      label: o.value === PLAIN_LANGUAGE ? labels.plain : o.label,
    })),
  ];
  if (!options.some((o) => o.value === current)) options.push({ value: current, label: current });
  return options;
}

/**
 * Language picker for a code block card, filterable from the keyboard (#198).
 *
 * It was a plain `Select`: open it and scan. Typing `py` should get you Python,
 * which is what the tags combobox in the settings sheet already does — so this
 * is built the same way, `Command` inside a `Popover`.
 *
 * It matters more than the ten-item list suggests: the fence input rule
 * deliberately stopped capturing the language in #172 (capturing the next word
 * is what swallowed `const` in ```const x = 1), so this picker is now the main
 * way a language gets set, on the hot path for the writing this editor is for.
 */
export function CodeLanguagePicker({
  value,
  onChange,
}: {
  value: string;
  /** Called with the picked option's value; `AUTO` means an untagged fence. */
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () =>
      languageOptions(value, {
        auto: t("editor.codeLanguageAuto"),
        plain: t("editor.codeLanguagePlain"),
      }),
    [value, t],
  );
  const current = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={open}
            aria-label={t("editor.codeLanguage")}
            className="h-6 w-auto gap-1 px-1.5 text-xs font-normal text-muted-foreground"
          />
        }
      >
        {current?.label ?? value}
        <CaretUpDownIcon className="size-3 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={t("editor.codeLanguageSearch")} />
          <CommandList>
            <CommandEmpty>{t("editor.codeLanguageNoResults")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  // Both, so `py` finds Python and `js` finds JavaScript: the
                  // value is what an author types, the label is what they read.
                  value={`${option.value} ${option.label}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-3.5",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1">{option.label}</span>
                  {option.value !== AUTO && (
                    <span className="text-xs text-muted-foreground">{option.value}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
