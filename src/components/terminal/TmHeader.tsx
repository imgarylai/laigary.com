import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { breadcrumbForPath } from "@/lib/fsmap";

export type NavItem = { label: string; to: string; params?: Record<string, string> };

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
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const isDark = resolvedTheme !== "light";
  const themeIcon = mounted ? (isDark ? "☀" : "☾") : "☀";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const themeTitle = isDark ? "light mode" : "dark mode";

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
          ⌕ <Kbd className="tm-btn--kbd">⌘K</Kbd>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="tm-btn"
          onClick={toggleTheme}
          title={themeTitle}
          suppressHydrationWarning
        >
          {themeIcon}
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
          title="search (⌘K)"
        >
          ⌕
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="tm-btn"
          onClick={toggleTheme}
          title={themeTitle}
          suppressHydrationWarning
        >
          {themeIcon}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="tm-btn"
          onClick={() => setMenuOpen((v) => !v)}
          title="menu"
        >
          {menuOpen ? "✕" : "≡"}
        </Button>
      </div>

      {menuOpen && (
        <div className="tm-drawer">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to} params={item.params} className="tm-drawer__link">
              $ cd ./{item.label === "~" ? "" : item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
