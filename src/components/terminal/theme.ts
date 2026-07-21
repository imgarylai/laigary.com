import { useEffect, useState } from "react";

// Terminal-frontend theme. Independent from the admin's next-themes: dark is the
// default, the choice persists under `gary-blog-theme`, and it is applied as a
// `data-theme` attribute on <html> (which the `--tm-*` CSS variables key off).

export const TM_THEME_KEY = "gary-blog-theme";
export type TmTheme = "dark" | "light";

// Inline script injected into the document <head> so the attribute is correct
// before first paint (no light-mode flash on a dark-default site).
export const TM_NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  TM_THEME_KEY,
)})||"dark";document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

function currentTheme(): TmTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function useTerminalTheme(): [TmTheme, () => void] {
  const [theme, setTheme] = useState<TmTheme>("dark");

  // Sync from the attribute the no-flash script already set (avoids SSR flash).
  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: TmTheme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(TM_THEME_KEY, next);
      } catch {
        // ignore storage failures (private mode etc.)
      }
      return next;
    });
  };

  return [theme, toggle];
}
