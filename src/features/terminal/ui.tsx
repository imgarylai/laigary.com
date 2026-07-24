import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReadingProgress } from "@/hooks/use-reading-progress";

// Small terminal primitives. Styling is Tailwind utilities (terminal colours via
// the `tm-*` utilities); callers may pass an extra class for contextual spacing.

const RULE_CHARS = 70;

// ASCII horizontal rule — part of the design language; deliberately not an <hr>.
export function AsciiRule({ thick = false, className }: { thick?: boolean; className?: string }) {
  return (
    <pre
      aria-hidden
      className={cn(
        "m-0 select-none overflow-hidden text-[calc(0.8125rem*var(--tm-fs))] text-tm-dim",
        className,
      )}
    >
      {(thick ? "═" : "─").repeat(RULE_CHARS)}
    </pre>
  );
}

// A `$ ...` prompt line shown above page content.
export function PromptLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <pre className={cn("m-0 mb-3 text-[calc(0.8125rem*var(--tm-fs))] text-tm-muted", className)}>
      {children}
    </pre>
  );
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
