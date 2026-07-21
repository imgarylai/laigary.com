// OG image templates: plain satori VNode trees (no JSX so this module stays
// framework-free and unit-testable). Visuals mirror the Next.js-era
// opengraph-image.tsx files: dark terminal aesthetic, JetBrains Mono with a
// Noto Sans TC fallback for CJK glyphs.

export interface OgNode {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
}

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// satori resolves missing glyphs across the loaded fonts in stack order.
const FONT_STACK = "JetBrains Mono, Noto Sans TC";

function h(type: string, props: Record<string, unknown>, ...children: unknown[]): OgNode {
  return {
    type,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  };
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
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        color: "#fafafa",
        fontFamily: FONT_STACK,
      },
    },
    h("div", { style: { fontSize: 64, fontWeight: 700, letterSpacing: "-0.02em" } }, siteName),
    h("div", { style: { fontSize: 28, color: "#a1a1aa", marginTop: 16 } }, description),
    h("div", { style: { fontSize: 20, color: "#52525b", marginTop: 8 } }, siteUrl),
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
  const children: OgNode[] = [];
  if (kicker) {
    children.push(h("div", { style: { display: "flex", color: "#71717a", fontSize: 22 } }, kicker));
  }
  children.push(
    h(
      "div",
      {
        style: {
          fontSize: title.length > 40 ? 48 : 60,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          maxWidth: "90%",
        },
      },
      title,
    ),
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
      h("div", { style: { fontSize: 24, color: "#a1a1aa" } }, branding),
      dateLabel ? h("div", { style: { fontSize: 20, color: "#71717a" } }, dateLabel) : "",
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
        backgroundColor: "#0a0a0a",
        color: "#fafafa",
        fontFamily: FONT_STACK,
        padding: 80,
      },
    },
    ...children,
  );
}
