import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// One persisted preference and no-flash script for every route. Public pages
// default to light; admin keeps its system default. Both attributes are needed:
// shadcn reads .dark, while the scoped public tokens read data-theme.
export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: "light" | "system";
}) {
  return (
    <NextThemesProvider
      attribute={["class", "data-theme"]}
      defaultTheme={defaultTheme}
      enableSystem
      storageKey="gary-blog-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from "next-themes";
