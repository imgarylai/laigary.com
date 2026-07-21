import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Single site-wide theme provider. It writes BOTH attributes on <html> so one
// toggle drives the whole app:
//   - `class`      → the admin's shadcn tokens key off `.dark`
//   - `data-theme` → the terminal frontend's `--tm-*` vars key off
//                    `[data-theme="light"]` (dark is the default/unset state)
// Default follows the OS: the `system` theme resolves to light/dark from
// `prefers-color-scheme`, and next-themes writes the RESOLVED value to both
// attributes (so the CSS always sees a concrete light/dark). It injects its own
// no-flash script, so no manual inline script is needed.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute={["class", "data-theme"]}
      defaultTheme="system"
      enableSystem
      storageKey="gary-blog-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from "next-themes";
