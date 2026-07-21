import { useState, type ReactNode } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TmHeader, type NavItem } from "./TmHeader";
import { CommandPalette, type PaletteRow } from "./CommandPalette";

// Root wrapper for a terminal namespace (blog or interview). Owns the ⌘K state
// (bound once via react-hotkeys-hook — the app's single hotkey registry) and
// renders header + content + palette. Nav items and palette rows are supplied by
// the layout route so each namespace keeps its own header and search index.
export function TerminalShell({
  homeTo,
  navItems,
  palettePages,
  paletteSearch,
  palettePlaceholder,
  children,
}: {
  homeTo: string;
  navItems: NavItem[];
  palettePages: PaletteRow[];
  paletteSearch: (query: string) => Promise<PaletteRow[]>;
  palettePlaceholder: string;
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
    <div className="tm-root">
      <TmHeader homeTo={homeTo} navItems={navItems} onOpenPalette={() => setCmdOpen(true)} />
      <main>{children}</main>
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
