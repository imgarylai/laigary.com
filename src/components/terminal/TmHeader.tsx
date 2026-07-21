import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ListIcon,
  MagnifyingGlassIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  TranslateIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useI18n } from "@/i18n/I18nProvider";
import { breadcrumbForPath } from "@/lib/fsmap";

export type NavItem = { label: string; to: string; params?: Record<string, string> };

const ICON = 15;

// Theme is a 3-state cycle: system → light → dark → system.
const THEME_ORDER = ["system", "light", "dark"] as const;
const THEME_ICON = { system: MonitorIcon, light: SunIcon, dark: MoonIcon };

// Is a nav item the active route? Exact match always counts; prefix match only
// for non-root, non-home, non-parameterised items (so "/" and the namespace
// home don't light up everywhere, and `$param` placeholders don't false-match).
function isActive(pathname: string, item: NavItem, homeTo: string): boolean {
  if (pathname === item.to) return true;
  return (
    item.to !== "/" && item.to !== homeTo && !item.params && pathname.startsWith(item.to + "/")
  );
}

export function TmHeader({
  homeTo,
  navItems,
  onOpenPalette,
}: {
  homeTo: string;
  navItems: NavItem[];
  onOpenPalette: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  // Until mounted, render the neutral "system" icon to avoid a hydration
  // mismatch (the resolved theme isn't known during SSR).
  const mode = mounted ? ((theme ?? "system") as (typeof THEME_ORDER)[number]) : "system";
  const cycleTheme = () =>
    setTheme(THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length]);
  const ThemeIcon = THEME_ICON[mode] ?? MonitorIcon;
  const toggleLocale = () => setLocale(locale === "zh-TW" ? "en" : "zh-TW");
  const localeLabel = locale === "zh-TW" ? "zh" : "en";

  return (
    <header className="tm-header">
      <div className="tm-header__left">
        <Link to={homeTo} title="cd ~" className="tm-brand">
          <span className="tm-dots">
            <span className="tm-dot tm-dot--red" />
            <span className="tm-dot tm-dot--yellow" />
            <span className="tm-dot tm-dot--green" />
          </span>
          <span className="tm-brand__name">@laigary.com</span>
        </Link>
        <span className="tm-crumb">~/{breadcrumbForPath(pathname)}</span>
        <span className="tm-sigil">$</span>
      </div>

      {/* Desktop nav */}
      <nav className="tm-nav">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            params={item.params}
            className={
              isActive(pathname, item, homeTo)
                ? "tm-nav__link tm-nav__link--active"
                : "tm-nav__link"
            }
          >
            {item.label}
          </Link>
        ))}
        <span className="tm-nav__sep" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="tm-btn"
          onClick={onOpenPalette}
        >
          <MagnifyingGlassIcon size={ICON} /> <Kbd className="tm-btn--kbd">⌘K</Kbd>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="tm-btn"
          onClick={toggleLocale}
          title={t("common.language")}
        >
          <TranslateIcon size={ICON} /> {localeLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="tm-btn"
          onClick={cycleTheme}
          title={`${t("common.toggleTheme")}: ${mode}`}
        >
          <ThemeIcon size={ICON} />
        </Button>
      </nav>

      {/* Mobile controls */}
      <div className="tm-controls">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="tm-btn"
          onClick={onOpenPalette}
          title={t("common.search")}
        >
          <MagnifyingGlassIcon size={ICON} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="tm-btn"
          onClick={cycleTheme}
          title={`${t("common.toggleTheme")}: ${mode}`}
        >
          <ThemeIcon size={ICON} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="tm-btn"
          onClick={() => setMenuOpen((v) => !v)}
          title={t("common.menu")}
        >
          {menuOpen ? <XIcon size={ICON} /> : <ListIcon size={ICON} />}
        </Button>
      </div>

      {menuOpen && (
        <div className="tm-drawer">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to} params={item.params} className="tm-drawer__link">
              $ cd ./{item.label === "~" ? "" : item.label}
            </Link>
          ))}
          <button type="button" className="tm-drawer__link" onClick={toggleLocale}>
            $ locale --set {locale === "zh-TW" ? "en" : "zh-TW"}
          </button>
        </div>
      )}
    </header>
  );
}
