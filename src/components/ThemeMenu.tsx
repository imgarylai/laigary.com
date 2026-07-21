import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/I18nProvider";

const MODES = [
  { value: "light", icon: SunIcon, labelKey: "common.themeLight" },
  { value: "dark", icon: MoonIcon, labelKey: "common.themeDark" },
  { value: "system", icon: MonitorIcon, labelKey: "common.themeSystem" },
] as const;

type Mode = (typeof MODES)[number]["value"];

// Explicit light / dark / system picker, shared by the admin header and the
// terminal frontend header (button styling comes from the caller). Until
// mounted, the trigger shows the neutral "system" icon so SSR markup matches
// the first client render (the stored theme is only known on the client).
export function ThemeMenu({
  variant = "ghost",
  size = "icon",
  className,
}: Pick<ComponentProps<typeof Button>, "variant" | "size" | "className">) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const mode: Mode = mounted && (theme === "light" || theme === "dark") ? theme : "system";
  const TriggerIcon = MODES.find((m) => m.value === mode)?.icon ?? MonitorIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size={size}
            className={className}
            aria-label={t("common.toggleTheme")}
            title={`${t("common.toggleTheme")}: ${mode}`}
          />
        }
      >
        <TriggerIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={mode} onValueChange={(value) => setTheme(value as Mode)}>
          {MODES.map(({ value, icon: Icon, labelKey }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="size-4" /> {t(labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
