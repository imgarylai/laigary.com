import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Small terminal primitives shared across the blog + interview shells. Colors
// come from the `--tm-*` variables so everything tracks the active data-theme.

const RULE_CHARS = 70;

// ASCII horizontal rule — part of the design language; deliberately not an <hr>.
export function AsciiRule({ thick = false, style }: { thick?: boolean; style?: CSSProperties }) {
  return (
    <pre
      aria-hidden
      style={{
        margin: 0,
        color: "var(--tm-dim)",
        fontSize: 11,
        overflow: "hidden",
        userSelect: "none",
        ...style,
      }}
    >
      {(thick ? "═" : "─").repeat(RULE_CHARS)}
    </pre>
  );
}

// A `$ ...` prompt line (grey, small) shown above page content.
export function PromptLine({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <pre style={{ margin: "0 0 12px", color: "var(--tm-muted)", fontSize: 11, ...style }}>
      {children}
    </pre>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      style={{
        fontFamily: "inherit",
        fontSize: 11,
        padding: "3px 8px",
        background: "transparent",
        border: "1px solid var(--tm-border)",
        color: "var(--tm-muted)",
        cursor: "pointer",
        opacity: copied ? 1 : 0.7,
      }}
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}

// Top reading-progress bar tied to window scroll (the post body scrolls the
// document, not a nested container, in this SSR layout).
export function ReadingProgress() {
  const [pct, setPct] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        setPct(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);
  return (
    <div className="tm-progress-track">
      <div className="tm-progress-bar" style={{ width: `${pct * 100}%` }} />
    </div>
  );
}
