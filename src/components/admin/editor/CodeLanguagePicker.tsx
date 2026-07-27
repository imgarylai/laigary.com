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

/** The two names that come from the locale rather than from the grammar list. */
export type LanguageLabels = { auto: string; plain: string };

/**
 * The name to show for a language value.
 *
 * Total by construction, which is the point: a language the list does not carry
 * — content written before it existed, or a hand-typed fence — is named by its
 * own fence tag. Every value therefore has a label, so nothing downstream needs
 * a fallback for "no such option".
 */
export function labelFor(value: string, labels: LanguageLabels): string {
  if (value === AUTO) return labels.auto;
  if (value === PLAIN_LANGUAGE) return labels.plain;
  return CODE_LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/**
 * The options to offer for a block currently set to `current`.
 *
 * A language the list does not carry is surfaced as its own option rather than
 * silently rewriting the author's fence to something else — so `current` is
 * always among the options returned.
 */
export function languageOptions(current: string, labels: LanguageLabels): LanguageOption[] {
  const options: LanguageOption[] = [
    { value: AUTO, label: labels.auto },
    ...CODE_LANGUAGE_OPTIONS.map((o) => ({ value: o.value, label: labelFor(o.value, labels) })),
  ];
  if (!options.some((o) => o.value === current)) {
    options.push({ value: current, label: labelFor(current, labels) });
  }
  return options;
}

/** cmdk's searchable string for an option — also its identity to the list. */
function searchKey(value: string, label: string): string {
  return `${value} ${label}`;
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

  const labels = useMemo(
    () => ({ auto: t("editor.codeLanguageAuto"), plain: t("editor.codeLanguagePlain") }),
    [t],
  );
  const options = useMemo(() => languageOptions(value, labels), [value, labels]);
  // Not a lookup into `options`: labelFor is total, so there is no "not found"
  // case to guard here, and the two agree by construction.
  const currentLabel = labelFor(value, labels);

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
        {currentLabel}
        <CaretUpDownIcon className="size-3 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {/* Start on the language the block already has. cmdk otherwise
            highlights the first row, so opening the picker on a Python block
            and pressing Enter would quietly reset it to auto-detect — and
            picking with the keyboard is the point of this control. Typing hands
            the highlight to the best match, as usual. */}
        <Command defaultValue={searchKey(value, currentLabel)}>
          <CommandInput placeholder={t("editor.codeLanguageSearch")} />
          <CommandList>
            <CommandEmpty>{t("editor.codeLanguageNoResults")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  // The label does the work today: every fence name in the list
                  // is already a substring of its own label, so `py` finds
                  // Python either way, and only `plain` needs the label. The
                  // fence name is carried along for the pair that eventually
                  // diverges, and to match how TagsCombobox searches.
                  value={searchKey(option.value, option.label)}
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
