import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useReadingProgress } from "@/hooks/use-reading-progress";

// Small terminal primitives. Styling lives entirely in terminal.css; these just
// pick the right class (callers may pass an extra class for contextual spacing).

const RULE_CHARS = 70;

// ASCII horizontal rule — part of the design language; deliberately not an <hr>.
export function AsciiRule({ thick = false, className }: { thick?: boolean; className?: string }) {
  return (
    <pre aria-hidden className={cn("tm-rule", className)}>
      {(thick ? "═" : "─").repeat(RULE_CHARS)}
    </pre>
  );
}

// A `$ ...` prompt line shown above page content.
export function PromptLine({ children, className }: { children: ReactNode; className?: string }) {
  return <pre className={cn("tm-prompt", className)}>{children}</pre>;
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="tm-btn"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? "copied ✓" : "copy"}
    </Button>
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
