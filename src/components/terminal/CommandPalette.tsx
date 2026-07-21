import { useEffect, useMemo, useRef, useState } from "react";

export type PaletteRow = {
  kind: "page" | "content";
  label: string;
  sub?: string;
  haystack: string;
  onSelect: () => void;
};

// ⌘K command palette. Generic over its rows: the blog shell feeds it pages +
// posts, the interview shell feeds it sections + notes. Filtering is a simple
// substring match (blog scale is small); ↑/↓ move the selection, Enter runs it.
export function CommandPalette({
  open,
  onClose,
  rows,
  placeholder,
}: {
  open: boolean;
  onClose: () => void;
  rows: PaletteRow[];
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      inputRef.current?.focus();
    }
  }, [open]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return rows;
    return rows.filter((r) => r.haystack.toLowerCase().includes(ql));
  }, [q, rows]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  const run = (i: number) => {
    const row = filtered[i];
    if (row) {
      row.onSelect();
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 80,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "min(560px, calc(100vw - 32px))",
          background: "var(--tm-bg)",
          border: "1px solid var(--tm-border)",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderBottom: "1px solid var(--tm-border)",
          }}
        >
          <span style={{ color: "var(--tm-accent)" }}>⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(active);
              }
            }}
            placeholder={placeholder}
            style={{
              flex: 1,
              border: 0,
              background: "transparent",
              color: "var(--tm-fg)",
              fontFamily: "inherit",
              fontSize: 13,
              outline: "none",
            }}
          />
          <span style={{ color: "var(--tm-muted)", fontSize: 11 }}>esc</span>
        </div>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={{ padding: 16, color: "var(--tm-muted)", fontSize: 12 }}>no matches.</div>
          )}
          {filtered.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => run(i)}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                background: i === active ? "var(--tm-subtle)" : "transparent",
                border: 0,
                borderBottom: i < filtered.length - 1 ? "1px dashed var(--tm-border)" : 0,
                color: "var(--tm-fg)",
                fontFamily: "inherit",
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              <span style={{ color: "var(--tm-dim)", flexShrink: 0 }}>
                {r.kind === "content" ? "›" : "»"}
              </span>
              <span
                style={{
                  color: r.kind === "content" ? "var(--tm-muted)" : "var(--tm-fg)",
                  flexShrink: 0,
                }}
              >
                {r.label}
              </span>
              {r.sub && (
                <span
                  style={{
                    color: "var(--tm-fg)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.sub}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
