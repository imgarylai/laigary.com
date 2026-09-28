import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReadingProgress } from "@/hooks/use-reading-progress";

// Small terminal primitives. Styling is Tailwind utilities (terminal colours via
// the `tm-*` utilities); callers may pass an extra class for contextual spacing.

// Compatibility name for legacy content routes; the public UI uses real rules.
export function AsciiRule({ className }: { thick?: boolean; className?: string }) {
  return <hr aria-hidden className={cn("public-rule", className)} />;
}

// A `$ ...` prompt line shown above page content.
export function PromptLine({ children, className }: { children: ReactNode; className?: string }) {
  return <pre className={cn("m-0 mb-3 text-xs text-tm-muted", className)}>{children}</pre>;
}

// Top reading-progress bar tied to document scroll.
export function ReadingProgress() {
  const progress = useReadingProgress();
  return (
    <div className="tm-progress-track">
      <div className="tm-progress-bar" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}
