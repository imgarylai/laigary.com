// Code-native 1200×630 social cards, sharing the public site's editorial palette.
import { displayWidth, truncateToWidth } from "./excerpt";
import { getTranslation } from "@/i18n";

export interface OgNode {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
}
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const FONT_STACK = "Lato, Noto Sans TC";
const SITE = {
  canvas: "#f7f6f2",
  ink: "#20211f",
  muted: "#62665e",
  accent: "#365f4b",
  rule: "#dcded5",
};
const t = (key: string) => getTranslation("en", `public.${key}`);

function h(type: string, props: Record<string, unknown>, ...children: unknown[]): OgNode {
  return { type, props: { ...props, children: children.length === 1 ? children[0] : children } };
}

export function formatOgDate(unixSeconds: number | null | undefined): string | null {
  if (unixSeconds === null || unixSeconds === undefined || !Number.isFinite(unixSeconds))
    return null;
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

// Three explicit lines keep long CJK, English and unbroken URLs inside the card.
// Width budgets are conservative for the bundled sans face and CJK fallback.
function headlineWidth(text: string): number {
  // Lato's widest Latin letters need the same allowance as a full-width glyph.
  return Array.from(text).reduce(
    (total, char) =>
      total + (/[MWmw]/.test(char) || char.codePointAt(0)! > 0xffff ? 2 : displayWidth(char)),
    0,
  );
}

export function titleLines(title: string): { lines: string[]; fontSize: number } {
  const normalized = title.replace(/\s+/g, " ").trim();
  const width = displayWidth(normalized);
  const fontSize = width <= 48 ? 72 : width <= 88 ? 62 : 52;
  const columns = fontSize === 72 ? 26 : fontSize === 62 ? 31 : 37;
  const lines: string[] = [];
  let rest = normalized;
  while (rest && lines.length < 3) {
    let line = "";
    for (const char of rest) {
      if (headlineWidth(line + char) > columns) break;
      line += char;
    }
    if (lines.length === 2 && line.length < rest.length) {
      while (headlineWidth(line + "…") > columns) line = Array.from(line).slice(0, -1).join("");
      lines.push(`${line.trimEnd()}…`);
      break;
    }
    if (
      line.length < rest.length &&
      /[A-Za-z0-9]$/.test(line) &&
      /^[A-Za-z0-9]/.test(rest.slice(line.length))
    ) {
      const space = line.lastIndexOf(" ");
      if (space > line.length / 2) line = line.slice(0, space);
    }
    // Keep closing CJK punctuation off the next line and opening punctuation
    // off this line's end. Move a character with the punctuation when needed.
    while (
      line &&
      (/^[，。！？：；、）】》」』,.!?:;]/.test(rest.slice(line.length)) ||
        /[（【《「『]$/.test(line))
    ) {
      line = Array.from(line).slice(0, -1).join("").trimEnd();
    }
    lines.push(line.trim());
    rest = rest.slice(line.length).trimStart();
  }
  return { lines, fontSize };
}

function headline(title: string): OgNode {
  const { lines, fontSize } = titleLines(title);
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        fontWeight: 700,
        fontSize,
        lineHeight: 1.24,
        letterSpacing: "-0.02em",
      },
    },
    ...lines.map((line) => h("div", { style: { display: "flex", whiteSpace: "nowrap" } }, line)),
  );
}

function monogram(): OgNode {
  return h(
    "svg",
    { width: 52, height: 52, viewBox: "0 0 32 32" },
    h("rect", { width: 32, height: 32, rx: 7, fill: SITE.accent }),
    h("path", {
      d: "M14 10H9L6 13V20L9 23H15V17H12 M20 10V23H27",
      fill: "none",
      stroke: SITE.canvas,
      strokeWidth: 2.5,
      strokeLinecap: "square",
      strokeLinejoin: "round",
    }),
  );
}

function card(
  title: string,
  category: string,
  date: string | null,
  domain = t("domain"),
  description?: string,
): OgNode {
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: SITE.canvas,
        color: SITE.ink,
        fontFamily: FONT_STACK,
        padding: "52px 64px",
        borderTop: `10px solid ${SITE.accent}`,
      },
    },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 16, color: SITE.accent } },
      monogram(),
      h("div", { style: { display: "flex", fontSize: 28, fontWeight: 700 } }, t("brand")),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexGrow: 1,
          paddingTop: 22,
          paddingBottom: 22,
        },
      },
      headline(title),
      description
        ? h(
            "div",
            {
              style: {
                display: "flex",
                marginTop: 18,
                fontSize: 24,
                lineHeight: 1.4,
                color: SITE.muted,
              },
            },
            truncateToWidth(description, 90),
          )
        : "",
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 22,
          borderTop: `1px solid ${SITE.rule}`,
          fontSize: 22,
          color: SITE.muted,
        },
      },
      h(
        "div",
        { style: { display: "flex", gap: 22 } },
        h("span", { style: { color: SITE.accent } }, category),
        date ? h("span", {}, date) : "",
      ),
      h("div", { style: { display: "flex" } }, domain),
    ),
  );
}

export interface SiteOgInput {
  siteName: string;
  description: string;
  siteUrl: string;
}
export function siteTemplate({ description, siteUrl }: SiteOgInput): OgNode {
  return card(
    t("ogHeadline"),
    t("home"),
    null,
    siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    description,
  );
}

export interface ArticleOgInput {
  title: string;
  branding: string;
  dateLabel: string | null;
  kicker: string | null;
}

export function articleTemplate({ title, dateLabel, kicker }: ArticleOgInput): OgNode {
  const category = kicker?.startsWith("./interview/")
    ? t("notes")
    : kicker?.startsWith("./works/")
      ? t("work")
      : t("ogPage");
  return card(title, category, dateLabel);
}

export type PostOgInput = Pick<ArticleOgInput, "title" | "dateLabel">;
export function postTemplate({ title, dateLabel }: PostOgInput): OgNode {
  return card(title, t("writing"), dateLabel);
}
