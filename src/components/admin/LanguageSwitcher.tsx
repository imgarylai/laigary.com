import { TranslateIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/I18nProvider";
import { type Locale, localeNames } from "@/i18n";

const localeKeys: Locale[] = ["en", "zh-TW"];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Switch language" />}
      >
        <TranslateIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {localeKeys.map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setLocale(key)}
            className={locale === key ? "font-bold" : ""}
          >
            {localeNames[key]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
