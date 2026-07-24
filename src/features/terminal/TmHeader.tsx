import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListIcon, MagnifyingGlassIcon, TranslateIcon, XIcon } from "@phosphor-icons/react";
import { TmButton } from "./Button";
import { Kbd } from "./Kbd";
import { TmThemeMenu } from "./ThemeMenu";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";
import { breadcrumbForPath } from "@/lib/fsmap";

export type NavItem = {
  label: string;
  to: string;
  params?: Record<string, string>;
  // Command shown in the mobile drawer — always derived via fsCmd (`cd` for
  // dirs, `cat` for files), never hardcoded from the label.
  cmd: string;
};

const ICON = 15;

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
  const { locale, setLocale, t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const toggleLocale = () => setLocale(locale === "zh-TW" ? "en" : "zh-TW");
  const localeLabel = locale === "zh-TW" ? "zh" : "en";

  const drawerLink =
    "w-full border-b border-dashed border-tm-border px-1 py-2.5 text-left text-sm text-tm-fg no-underline";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between whitespace-nowrap border-b border-tm-border bg-tm-bg">
      <div className="flex min-w-0 items-center gap-3 overflow-hidden px-3.5">
        <Link
          to={homeTo}
          title="cd ~"
          className="flex shrink-0 items-center gap-2 text-tm-fg no-underline"
        >
          <span className="flex shrink-0 gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-sm max-sm:hidden">@laigary.com</span>
        </Link>
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-tm-accent">
          ~/{breadcrumbForPath(pathname)}
        </span>
        <span className="shrink-0 text-sm text-tm-dim">$</span>
      </div>

      {/* Desktop nav */}
      <nav className="hidden items-center gap-3.5 whitespace-nowrap px-6 md:flex">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            params={item.params}
            className={cn(
              "text-sm no-underline",
              isActive(pathname, item, homeTo) ? "text-tm-accent" : "text-tm-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
        <span className="h-3.5 w-px bg-tm-border" />
        <TmButton type="button" size="sm" onClick={onOpenPalette}>
          <MagnifyingGlassIcon size={ICON} /> <Kbd className="text-tm-dim">⌘K</Kbd>
        </TmButton>
        <TmButton type="button" size="sm" onClick={toggleLocale} title={t("common.language")}>
          <TranslateIcon size={ICON} /> {localeLabel}
        </TmButton>
        <TmThemeMenu size="sm" />
      </nav>

      {/* Mobile controls */}
      <div className="flex items-center gap-2 px-3.5 md:hidden">
        <TmButton type="button" size="icon" onClick={onOpenPalette} title={t("common.search")}>
          <MagnifyingGlassIcon size={ICON} />
        </TmButton>
        <TmThemeMenu size="icon" />
        <TmButton
          type="button"
          size="icon"
          onClick={() => setMenuOpen((v) => !v)}
          title={t("common.menu")}
        >
          {menuOpen ? <XIcon size={ICON} /> : <ListIcon size={ICON} />}
        </TmButton>
      </div>

      {menuOpen && (
        <div className="absolute inset-x-0 top-14 z-[9] flex flex-col border-b border-tm-border bg-tm-bg px-3.5 py-2.5">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to} params={item.params} className={drawerLink}>
              $ {item.cmd}
            </Link>
          ))}
          <button
            type="button"
            className={cn(drawerLink, "cursor-pointer bg-transparent")}
            onClick={toggleLocale}
          >
            $ locale --set {locale === "zh-TW" ? "en" : "zh-TW"}
          </button>
        </div>
      )}
    </header>
  );
}
