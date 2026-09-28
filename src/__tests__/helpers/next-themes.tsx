import type { ComponentProps } from "react";
import { vi } from "vitest";

/** Keep theme context/effects real, but don't mount an executable SSR script. */
export async function mockNextThemes() {
  const actual = await vi.importActual<typeof import("next-themes")>("next-themes");
  return {
    ...actual,
    ThemeProvider: (props: ComponentProps<typeof actual.ThemeProvider>) => (
      // Route tests use createRoot, not hydration. next-themes' no-flash script
      // is meant to execute from server HTML before hydration; React 19.3 warns
      // about mounting it client-side, where it cannot execute. Keep its text
      // in an inert data block while exercising the real provider's effects.
      <actual.ThemeProvider
        {...props}
        scriptProps={{ ...props.scriptProps, type: "application/json" }}
      />
    ),
  };
}
