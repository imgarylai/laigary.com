import { Link, useRouterState } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ListIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useI18n } from "@/i18n/I18nProvider";
import { PublicThemeMenu } from "./ThemeMenu";
import { PUBLIC_NAV } from "./navigation";

export function PublicHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <HeaderContent key={pathname} onOpenSearch={onOpenSearch} />;
}

// A navigation remounts the header so transient menu state cannot survive Back/Forward.
function HeaderContent({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  const navigation = PUBLIC_NAV.map(({ labelKey, ...link }) => (
    <Link key={labelKey} {...link} onClick={() => setMenuOpen(false)} className="public-nav-link">
      {t(labelKey)}
    </Link>
  ));

  return (
    <header
      className="public-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          setMenuOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <div className="public-header-inner">
        <Link to="/" className="public-wordmark">
          {t("public.brand")}
        </Link>
        <nav aria-label={t("public.navigation")} className="public-desktop-nav">
          {navigation}
        </nav>
        <div className="public-utilities">
          <button
            type="button"
            className="public-icon-button"
            aria-label={t("common.search")}
            onClick={() => {
              setMenuOpen(false);
              onOpenSearch();
            }}
          >
            <MagnifyingGlassIcon size={19} aria-hidden />
            <span className="public-search-label">{t("common.search")}</span>
          </button>
          <PublicThemeMenu />
          <button
            ref={menuButton}
            type="button"
            className="public-icon-button public-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            aria-label={t(menuOpen ? "public.closeMenu" : "common.menu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <XIcon size={21} aria-hidden /> : <ListIcon size={21} aria-hidden />}
          </button>
        </div>
      </div>
      <nav
        id="public-mobile-menu"
        hidden={!menuOpen}
        aria-label={t("public.mobileNavigation")}
        className="public-mobile-nav"
      >
        {navigation}
      </nav>
    </header>
  );
}
