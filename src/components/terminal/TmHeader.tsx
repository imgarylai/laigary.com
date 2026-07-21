import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { useTerminalTheme } from "./theme";

export type NavItem = { label: string; to: string; params?: Record<string, string> };

function truncate(slug: string): string {
  return slug.length > 22 ? slug.slice(0, 20) + "…" : slug;
}

// Breadcrumb text (the `~/…` after the macOS dots) derived from the pathname,
// following the fsmap conventions — kept here so it stays next to the nav.
function breadcrumbFor(pathname: string): string {
  const seg = pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
  if (seg[0] === "interview") {
    if (seg.length === 1) return "interview";
    if (seg.length === 2) return `interview/${seg[1]}`;
    return `interview/${seg[1]}/${truncate(seg[2])}.md`;
  }
  if (seg.length === 0) return "";
  if (seg[0] === "posts") return seg.length === 1 ? "posts" : `posts/${truncate(seg[1])}.md`;
  if (seg[0] === "tags") return "tags";
  return `${truncate(seg[0])}.md`;
}

const iconBtn: CSSProperties = {
  width: 30,
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "1px solid var(--tm-border)",
  padding: 0,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 13,
  lineHeight: 1,
};

export function TmHeader({
  homeTo,
  navItems,
  onOpenPalette,
}: {
  homeTo: string;
  navItems: NavItem[];
  onOpenPalette: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [theme, toggle] = useTerminalTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const breadcrumb = breadcrumbFor(pathname);
  const themeIcon = theme === "dark" ? "☀" : "☾";

  return (
    <header
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--tm-border)",
        background: "var(--tm-bg)",
        whiteSpace: "nowrap",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
      className="tm-header"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minWidth: 0,
          overflow: "hidden",
          padding: "0 14px",
        }}
      >
        <Link
          to={homeTo}
          title="cd ~"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            flexShrink: 0,
            textDecoration: "none",
            color: "var(--tm-fg)",
          }}
        >
          <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: "#ff5f57" }} />
            <span style={{ width: 10, height: 10, borderRadius: 5, background: "#febc2e" }} />
            <span style={{ width: 10, height: 10, borderRadius: 5, background: "#28c840" }} />
          </span>
          <span style={{ fontSize: 12 }} className="tm-hide-sm">
            @laigary.com
          </span>
        </Link>
        <span
          style={{
            color: "var(--tm-accent)",
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          ~/{breadcrumb}
        </span>
        <span style={{ color: "var(--tm-dim)", fontSize: 12, flexShrink: 0 }}>$</span>
      </div>

      {/* Desktop nav */}
      <nav className="tm-nav-desktop" style={{ padding: "0 24px" }}>
        {navItems.map((item) => {
          // Exact match always counts; prefix match only for non-root, non-home
          // items (so "/" and the namespace home don't light up everywhere).
          const active =
            pathname === item.to ||
            (item.to !== "/" &&
              item.to !== homeTo &&
              !item.params &&
              pathname.startsWith(item.to + "/"));
          return (
            <Link
              key={item.label}
              to={item.to}
              params={item.params}
              style={{
                fontFamily: "inherit",
                fontSize: 12,
                textDecoration: "none",
                color: active ? "var(--tm-accent)" : "var(--tm-muted)",
              }}
            >
              {item.label}
            </Link>
          );
        })}
        <span style={{ width: 1, height: 14, background: "var(--tm-border)" }} />
        <button
          type="button"
          onClick={onOpenPalette}
          title="search"
          style={{
            background: "transparent",
            border: "1px solid var(--tm-border)",
            padding: "3px 8px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 11,
            color: "var(--tm-muted)",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          ⌕ <span style={{ color: "var(--tm-dim)" }}>⌘K</span>
        </button>
        <button
          type="button"
          onClick={toggle}
          title={theme === "dark" ? "light mode" : "dark mode"}
          style={{
            background: "transparent",
            border: "1px solid var(--tm-border)",
            padding: "3px 8px",
            cursor: "pointer",
            color: "var(--tm-muted)",
            fontSize: 12,
            fontFamily: "inherit",
            lineHeight: 1,
          }}
        >
          {themeIcon}
        </button>
      </nav>

      {/* Mobile controls */}
      <div className="tm-nav-mobile" style={{ padding: "0 14px", gap: 8 }}>
        <button
          type="button"
          onClick={onOpenPalette}
          title="search (⌘K)"
          style={{ ...iconBtn, color: "var(--tm-muted)" }}
        >
          ⌕
        </button>
        <button
          type="button"
          onClick={toggle}
          title={theme === "dark" ? "light mode" : "dark mode"}
          style={{ ...iconBtn, color: "var(--tm-muted)" }}
        >
          {themeIcon}
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          title="menu"
          style={{ ...iconBtn, color: "var(--tm-fg)" }}
        >
          {menuOpen ? "✕" : "≡"}
        </button>
      </div>

      {menuOpen && (
        <div
          className="tm-drawer"
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            background: "var(--tm-bg)",
            borderBottom: "1px solid var(--tm-border)",
            padding: "10px 14px",
            zIndex: 9,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              params={item.params}
              style={{
                padding: "10px 4px",
                textAlign: "left",
                fontFamily: "inherit",
                fontSize: 13,
                textDecoration: "none",
                color: "var(--tm-fg)",
                borderBottom: "1px dashed var(--tm-border)",
              }}
            >
              $ cd ./{item.label === "~" ? "" : item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
