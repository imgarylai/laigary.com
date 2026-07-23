import { useState, type ReactNode } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TmHeader, type NavItem } from "./TmHeader";
import { TmFooter, type FooterSocial } from "./TmFooter";
import { CommandPalette, type PaletteRow } from "./CommandPalette";

// Root wrapper for a terminal namespace (blog or interview). Owns the ⌘K state
// (bound once via react-hotkeys-hook — the app's single hotkey registry) and
// renders header + content + footer + palette. Nav items and palette rows are
// supplied by the layout route so each namespace keeps its own header and
// search index.
//
// Sticky-footer layout: the root is a min-h-screen flex column and <main> is
// flex-1, so the tmux-style status bar sits at the bottom of the viewport on
// short pages and follows the content on long ones (it is not viewport-fixed).
export function TerminalShell({
  homeTo,
  navItems,
  palettePages,
  paletteSearch,
  palettePlaceholder,
  siteName,
  social,
  children,
}: {
  homeTo: string;
  navItems: NavItem[];
  palettePages: PaletteRow[];
  paletteSearch: (query: string) => Promise<PaletteRow[]>;
  palettePlaceholder: string;
  siteName: string;
  social: FooterSocial;
  children: ReactNode;
}) {
  const [cmdOpen, setCmdOpen] = useState(false);

  useHotkeys(
    "mod+k",
    (e) => {
      e.preventDefault();
      setCmdOpen((v) => !v);
    },
    { enableOnFormTags: true, enableOnContentEditable: true },
  );

  return (
    <div className="tm-root flex flex-col">
      <TmHeader homeTo={homeTo} navItems={navItems} onOpenPalette={() => setCmdOpen(true)} />
      <main className="flex-1">{children}</main>
      <TmFooter siteName={siteName} social={social} />
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        pages={palettePages}
        searchContent={paletteSearch}
        placeholder={palettePlaceholder}
      />
    </div>
  );
}
