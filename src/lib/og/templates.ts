// OG image templates: plain satori VNode trees (no JSX so this module stays
// framework-free and unit-testable). Visuals follow the terminal design
// language (see /design-system): the `--tm-*` dark palette, JetBrains Mono
// (Noto Sans TC fallback for CJK), macOS traffic-light dots, a `$` prompt line
// and an ASCII rule.

import { displayWidth, truncateToWidth } from "./excerpt";

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
 * ISO day (e.g. 2025-07-19) from unix seconds.
 *
 * Every card labels its date this way. It used to be a zh-TW long date, but the
 * cards read as terminal output and `2025年7月19日` does not — and a post's card
 * shows the same day inside a front-matter block, where the ISO form is what a
 * reader would expect to see. UTC, which is what the worker runs in and what
 * `unixToIso` produces for the pages themselves.
 */
export function formatOgDate(unixSeconds: number | null | undefined): string | null {
  if (unixSeconds === null || unixSeconds === undefined || !Number.isFinite(unixSeconds)) {
    return null;
  }
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
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

/**
 * The shell every card shares: terminal chrome on top, an ASCII rule and the
 * branding/date footer at the bottom, and whatever the caller puts between.
 */
function card(body: OgNode, branding: string, dateLabel: string | null): OgNode {
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
    body,
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

/** `$ cat <path>` — the prompt line the article pages print for themselves. */
function promptLine(kicker: string): OgNode {
  return h(
    "div",
    { style: { display: "flex", color: TM.muted, fontSize: 24, marginBottom: 18 } },
    `$ cat ${kicker}`,
  );
}

export function articleTemplate({ title, branding, dateLabel, kicker }: ArticleOgInput): OgNode {
  const body: OgNode[] = [];
  if (kicker) body.push(promptLine(kicker));
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

  return card(
    h("div", { style: { display: "flex", flexDirection: "column" } }, ...body),
    branding,
    dateLabel,
  );
}

export interface PostOgInput {
  title: string;
  branding: string;
  /** ISO day, e.g. `2026-08-05` — the form the article page prints. */
  dateLabel: string | null;
  kicker: string;
  /** Plain-text opening of the article, already trimmed to fit. */
  excerpt: string;
}

/**
 * The post card, which is the whole `cat` rather than a headline.
 *
 * The article page prints a front-matter block and then its text; the card
 * shows the same thing, so the two agree about what a post looks like instead
 * of each deciding separately. The title lives inside the block as a `title:`
 * row, set larger and brighter than its key — it is the one thing that has to
 * survive a thumbnail, and the block still reads as file contents.
 */
/**
 * Columns the title row has left after its key, per font size.
 *
 * The card is 1200px wide with 72px of padding, and a monospace glyph advances
 * about 0.6em — so the value has roughly (1056 - 101) / (size * 0.6) columns
 * next to a 24px `title: `. The row cannot wrap (it would break the alignment
 * the block depends on), so the size steps down until the title fits, and the
 * smallest step truncates. Measured in display width, because a CJK title of
 * the same character count is twice as wide.
 */
const TITLE_SIZES = [
  { fontSize: 36, columns: 44 },
  { fontSize: 30, columns: 53 },
  { fontSize: 24, columns: 66 },
] as const;

function fitTitle(title: string): { shownTitle: string; titleSize: number } {
  const width = displayWidth(title);
  for (const step of TITLE_SIZES) {
    if (width <= step.columns) return { shownTitle: title, titleSize: step.fontSize };
  }
  const smallest = TITLE_SIZES[TITLE_SIZES.length - 1];
  return {
    shownTitle: truncateToWidth(title, smallest.columns),
    titleSize: smallest.fontSize,
  };
}

export function postTemplate({ title, branding, dateLabel, kicker, excerpt }: PostOgInput): OgNode {
  const { shownTitle, titleSize } = fitTitle(title);

  // `whiteSpace: pre` keeps the key padding that lines the values up; satori
  // collapses runs of spaces the way a browser does. It is why the article page
  // renders this block in a <pre>.
  const row = (text: string, color: string): OgNode =>
    h(
      "div",
      { style: { display: "flex", color, fontSize: 24, lineHeight: 1.6, whiteSpace: "pre" } },
      text,
    );

  const block = h(
    "div",
    { style: { display: "flex", flexDirection: "column", marginBottom: 20 } },
    row("---", TM.muted),
    h(
      "div",
      { style: { display: "flex", alignItems: "baseline" } },
      row("title: ", TM.muted),
      // Larger than the rest of the block: at thumbnail size the title is the
      // one thing a reader has to be able to make out, and 24px grey monospace
      // does not survive a Slack preview. The key stays small so the row still
      // reads as `key: value`.
      h(
        "div",
        { style: { display: "flex", color: TM.fg, fontSize: titleSize, whiteSpace: "pre" } },
        shownTitle,
      ),
    ),
    row("---", TM.muted),
  );

  return card(
    h(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
      promptLine(kicker),
      block,
      h(
        "div",
        {
          style: {
            display: "flex",
            color: TM.dim,
            fontSize: 24,
            lineHeight: 1.6,
            maxWidth: "94%",
          },
        },
        excerpt,
      ),
    ),
    branding,
    dateLabel,
  );
}
