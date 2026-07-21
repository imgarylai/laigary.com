import { ThemeMenu } from "@/components/ThemeMenu";

// Admin-header theme control — the shared light/dark/system dropdown with the
// admin's ghost styling.
export function ThemeToggle() {
  return <ThemeMenu variant="ghost" size="icon" />;
}
