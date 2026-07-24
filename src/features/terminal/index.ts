// Public API of the terminal frontend module. External code (routes, router,
// tests) imports from here — never from the module's internal files — so the
// module's boundary stays a single, refactor-safe surface.
//
// The module owns its own base widgets (Button, Kbd, CommandMenu) built on
// Base UI + cmdk, so it no longer borrows from `@/components/ui` (shadcn). Those
// widgets are intentionally internal and not re-exported.

export { TerminalShell } from "./TerminalShell";
export { TmNotFound } from "./NotFound";
export { TmHeader, type NavItem } from "./TmHeader";
export { TmFooter, type FooterSocial } from "./TmFooter";
export { CommandPalette, type PaletteRow } from "./CommandPalette";
export { TmPager, pageWindow } from "./Pager";
export { AsciiRule, PromptLine, ReadingProgress } from "./ui";
export { Prose } from "./Prose";
export { TmPage, TmMeta, TmEmpty, TmDirLink, TmDirCells, TmRowLink, TmRowCells } from "./layout";
