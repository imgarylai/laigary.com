// Font loading for OG images.
//
// JetBrains Mono ships as static TTFs under public/fonts/ and is fetched from
// our own origin once per isolate (satori cannot parse the variable woff2 that
// @fontsource-variable provides). CJK glyphs are not in JetBrains Mono at all,
// so a per-request Noto Sans TC subset covering exactly the rendered glyphs is
// fetched from the Google Fonts css2 API.

import type { OgNode } from "./templates";

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

// Safari 5 predates woff support, so Google serves plain TTF (satori cannot
// parse woff/woff2; every modern UA string gets woff2 or woff).
const TTF_FORCING_UA =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

/**
 * Every non-printable-ASCII glyph appearing anywhere in the node tree, deduped.
 * JSON.stringify escapes control characters, so what remains outside the
 * printable ASCII range is exactly the set of glyphs needing the CJK fallback.
 */
export function collectNonAsciiGlyphs(node: OgNode): string {
  const matches = JSON.stringify(node).match(/[^ -~]/g) ?? [];
  return [...new Set(matches)].join("");
}

export function buildGoogleFontsCssUrl(family: string, weight: 400 | 700, text: string): string {
  const familyParam = family.replaceAll(" ", "+");
  return (
    `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}` +
    `&text=${encodeURIComponent(text)}`
  );
}

/** Extract the truetype/opentype font URL from a Google Fonts css2 response. */
export function parseTruetypeUrl(css: string): string | null {
  const match = css.match(/src:\s*url\((.+?)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/);
  return match ? match[1] : null;
}

export async function loadCjkSubset(
  text: string,
  weight: 400 | 700,
  fetchFn: FetchFn = fetch,
): Promise<OgFont | null> {
  if (!text) return null;
  const cssRes = await fetchFn(buildGoogleFontsCssUrl("Noto Sans TC", weight, text), {
    headers: { "User-Agent": TTF_FORCING_UA },
  });
  if (!cssRes.ok) return null;
  const fontUrl = parseTruetypeUrl(await cssRes.text());
  if (!fontUrl) return null;
  const fontRes = await fetchFn(fontUrl);
  if (!fontRes.ok) return null;
  return { name: "Noto Sans TC", data: await fontRes.arrayBuffer(), weight, style: "normal" };
}

const BUNDLED_FONT_PATHS: ReadonlyArray<{ path: string; weight: 400 | 700 }> = [
  { path: "/fonts/JetBrainsMono-Regular.ttf", weight: 400 },
  { path: "/fonts/JetBrainsMono-Bold.ttf", weight: 700 },
];

let bundledFontsPromise: Promise<OgFont[]> | null = null;

/**
 * JetBrains Mono from our own static assets, cached per isolate. `origin` is
 * taken from the incoming request so this works in dev and production alike.
 */
export function loadBundledFonts(origin: string, fetchFn: FetchFn = fetch): Promise<OgFont[]> {
  bundledFontsPromise ??= Promise.all(
    BUNDLED_FONT_PATHS.map(async ({ path, weight }): Promise<OgFont> => {
      const res = await fetchFn(new URL(path, origin).toString());
      if (!res.ok) {
        throw new Error(`Failed to load bundled font ${path}: ${res.status}`);
      }
      return { name: "JetBrains Mono", data: await res.arrayBuffer(), weight, style: "normal" };
    }),
  ).catch((error: unknown) => {
    // Reset so a transient asset failure does not poison the isolate cache.
    bundledFontsPromise = null;
    throw error;
  });
  return bundledFontsPromise;
}

/** Test hook: clear the per-isolate bundled-font cache. */
export function resetBundledFontsCache(): void {
  bundledFontsPromise = null;
}

/** The full font set for one render: bundled mono + CJK subsets for `text`. */
export async function loadOgFonts(
  origin: string,
  node: OgNode,
  fetchFn: FetchFn = fetch,
): Promise<OgFont[]> {
  const glyphs = collectNonAsciiGlyphs(node);
  const [bundled, cjkRegular, cjkBold] = await Promise.all([
    loadBundledFonts(origin, fetchFn),
    loadCjkSubset(glyphs, 400, fetchFn),
    loadCjkSubset(glyphs, 700, fetchFn),
  ]);
  return [...bundled, ...[cjkRegular, cjkBold].filter((f): f is OgFont => f !== null)];
}
