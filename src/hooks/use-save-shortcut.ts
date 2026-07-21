import { useEffect } from "react";

/**
 * Fire `onSave` on Cmd/Ctrl+S and prevent the browser's "save page" dialog.
 * Used by the admin forms so authors can save with the keyboard.
 */
export function useSaveShortcut(onSave: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave]);
}
