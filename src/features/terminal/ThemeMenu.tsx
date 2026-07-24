import { useEffect, useState } from "react";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { useTheme } from "@/components/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { TmButton } from "./Button";

const MODES = [
  { value: "light", icon: SunIcon, labelKey: "common.themeLight" },
  { value: "dark", icon: MoonIcon, labelKey: "common.themeDark" },
  { value: "system", icon: MonitorIcon, labelKey: "common.themeSystem" },
] as const;

type Mode = (typeof MODES)[number]["value"];

// Terminal-native theme picker (light / dark / system). Built on the Base UI
// menu primitive + <TmButton>, styled in the tm-* palette — so the frontend owns
// its entire header and no longer borrows the shared shadcn <ThemeMenu>. Theme
// state still comes from the shared app-level ThemeProvider: there is one theme
// context for the whole site, which is app infrastructure, not a UI-kit coupling.
// Until mounted, the trigger shows the neutral "system" icon so SSR markup
// matches the first client render (the stored theme is only known on the client).
export function TmThemeMenu({ size = "icon" }: { size?: "sm" | "icon" }) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const mode: Mode = mounted && (theme === "light" || theme === "dark") ? theme : "system";
  const TriggerIcon = MODES.find((m) => m.value === mode)?.icon ?? MonitorIcon;

  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        render={
          <TmButton
            type="button"
            size={size}
            aria-label={t("common.toggleTheme")}
            title={`${t("common.toggleTheme")}: ${mode}`}
          />
        }
      >
        <TriggerIcon className="size-4" />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner className="isolate z-50 outline-none" align="end" sideOffset={4}>
          <MenuPrimitive.Popup className="z-50 min-w-32 origin-(--transform-origin) border border-tm-border bg-tm-bg text-tm-fg outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <MenuPrimitive.RadioGroup
              value={mode}
              onValueChange={(value) => setTheme(value as Mode)}
            >
              {MODES.map(({ value, icon: Icon, labelKey }) => (
                <MenuPrimitive.RadioItem
                  key={value}
                  value={value}
                  className="relative flex cursor-default items-center gap-2 py-1.5 pr-8 pl-2 text-xs text-tm-muted outline-none select-none data-[highlighted]:bg-tm-subtle data-[highlighted]:text-tm-fg data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                >
                  <span className="pointer-events-none absolute right-2 flex items-center justify-center text-tm-accent">
                    <MenuPrimitive.RadioItemIndicator>
                      <CheckIcon />
                    </MenuPrimitive.RadioItemIndicator>
                  </span>
                  <Icon className="size-4" /> {t(labelKey)}
                </MenuPrimitive.RadioItem>
              ))}
            </MenuPrimitive.RadioGroup>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
