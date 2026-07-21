import { useEffect, useState, type ReactNode } from "react";
import { TmHeader, type NavItem } from "./TmHeader";
import { CommandPalette, type PaletteRow } from "./CommandPalette";

// Root wrapper for a terminal namespace (blog or interview). Owns the ⌘K state
// and the global key listener; renders header + content + palette. Nav items
// and palette rows are supplied by the layout route so each namespace keeps its
// own header and search index.
export function TerminalShell({
  homeTo,
  navItems,
  paletteRows,
  palettePlaceholder,
  children,
}: {
  homeTo: string;
  navItems: NavItem[];
  paletteRows: PaletteRow[];
  palettePlaceholder: string;
  children: ReactNode;
}) {
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      } else if (e.key === "Escape") {
        setCmdOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="tm-root">
      <TmHeader homeTo={homeTo} navItems={navItems} onOpenPalette={() => setCmdOpen(true)} />
      <main>{children}</main>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        rows={paletteRows}
        placeholder={palettePlaceholder}
      />
    </div>
  );
}
