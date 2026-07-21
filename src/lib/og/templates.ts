// OG image templates: plain satori VNode trees (no JSX so this module stays
// framework-free and unit-testable). Visuals follow the terminal design
// language (see /design-system): the `--tm-*` dark palette, JetBrains Mono
// (Noto Sans TC fallback for CJK), macOS traffic-light dots, a `$` prompt line
// and an ASCII rule.

export interface OgNode {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
}

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// satori resolves missing glyphs across the loaded fonts in stack order.
const FONT_STACK = "JetBrains Mono, Noto Sans TC";

// Terminal palette (dark) — mirrors the `--tm-*` tokens in src/styles/terminal.css.
const TM = {
  bg: "#0b0d0c",
  fg: "#d4d4d4",
  muted: "#6b7280",
  dim: "#9ca3af",
  accent: "#7ee787",
  rule: "#2c3230",
} as const;

function h(type: string, props: Record<string, unknown>, ...children: unknown[]): OgNode {
  return {
    type,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  };
}

// macOS traffic-light dots + a `~/<crumb> $` prompt — the terminal window chrome
// shared by every template.
function topBar(crumb: string): OgNode {
  const dot = (color: string): OgNode =>
    h("div", {
      style: { display: "flex", width: 20, height: 20, borderRadius: 10, backgroundColor: color },
    });
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 16 } },
    h(
      "div",
      { style: { display: "flex", gap: 10 } },
      dot("#ff5f57"),
      dot("#febc2e"),
      dot("#28c840"),
    ),
    h("div", { style: { display: "flex", color: TM.accent, fontSize: 24 } }, crumb),
    h("div", { style: { display: "flex", color: TM.dim, fontSize: 24 } }, "$"),
  );
}

// ASCII horizontal rule (─ ×N), part of the design language.
function asciiRule(): OgNode {
  return h(
    "div",
    {
      style: {
        display: "flex",
        color: TM.rule,
        fontSize: 24,
        overflow: "hidden",
        whiteSpace: "nowrap",
      },
    },
    "─".repeat(80),
  );
}

/**
 * zh-TW long date (e.g. 2025年7月19日) from a `yyyy-MM-dd` string (the shape
 * `unixToIso` produces). Parsed textually — no Date round-trip, so the result
 * cannot shift a day across timezones.
 */
export function formatOgDateFromIsoDay(isoDay: string): string | null {
  const m = isoDay.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`;
}

/** zh-TW long date (e.g. 2025年7月19日) from unix seconds. */
export function formatOgDate(unixSeconds: number | null | undefined): string | null {
  if (unixSeconds === null || unixSeconds === undefined || !Number.isFinite(unixSeconds)) {
    return null;
  }
  return new Date(unixSeconds * 1000).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export interface SiteOgInput {
  siteName: string;
  description: string;
  siteUrl: string;
}

export function siteTemplate({ siteName, description, siteUrl }: SiteOgInput): OgNode {
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: TM.bg,
        color: TM.fg,
        fontFamily: FONT_STACK,
        padding: 72,
      },
    },
    topBar("~"),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", color: TM.muted, fontSize: 26 } }, "$ whoami"),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 10,
          },
        },
        siteName,
      ),
      h("div", { style: { display: "flex", marginTop: 26, marginBottom: 26 } }, asciiRule()),
      h(
        "div",
        {
          style: {
            display: "flex",
            color: TM.muted,
            fontSize: 30,
            maxWidth: "92%",
            lineHeight: 1.4,
          },
        },
        description,
      ),
    ),
    h("div", { style: { display: "flex", color: TM.dim, fontSize: 24 } }, `$ open ${siteUrl}`),
  );
}

export interface ArticleOgInput {
  title: string;
  branding: string;
  dateLabel: string | null;
  /** Breadcrumb-style prefix line, e.g. `./interview/system-design/`. */
  kicker: string | null;
}

export function articleTemplate({ title, branding, dateLabel, kicker }: ArticleOgInput): OgNode {
  const body: OgNode[] = [];
  if (kicker) {
    body.push(
      h(
        "div",
        { style: { display: "flex", color: TM.muted, fontSize: 24, marginBottom: 18 } },
        `$ cat ${kicker}`,
      ),
    );
  }
  body.push(
    h(
      "div",
      {
        style: {
          display: "flex",
          fontSize: title.length > 40 ? 48 : 60,
          fontWeight: 700,
          lineHeight: 1.25,
          letterSpacing: "-0.02em",
          maxWidth: "94%",
        },
      },
      title,
    ),
  );

  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: TM.bg,
        color: TM.fg,
        fontFamily: FONT_STACK,
        padding: 72,
      },
    },
    topBar("~"),
    h("div", { style: { display: "flex", flexDirection: "column" } }, ...body),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
      h("div", { style: { display: "flex", marginBottom: 22 } }, asciiRule()),
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          },
        },
        h("div", { style: { display: "flex", color: TM.accent, fontSize: 24 } }, branding),
        dateLabel
          ? h("div", { style: { display: "flex", color: TM.dim, fontSize: 22 } }, dateLabel)
          : "",
      ),
    ),
  );
}
