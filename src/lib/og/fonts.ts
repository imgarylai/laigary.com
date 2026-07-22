// Font loading for OG images.
//
// JetBrains Mono is inlined into the worker bundle at build time (Vite
// `?inline` -> base64) and decoded once per isolate — a self-fetch of the
// site's own origin 522s in production, so the bytes must not come from the
// network. satori cannot parse the variable woff2 that @fontsource-variable
// provides, hence the static TTFs. CJK glyphs are not in JetBrains Mono at
// all, so a per-request Noto Sans TC subset covering exactly the rendered
// glyphs is fetched from the Google Fonts css2 API.

import jbmRegularInline from "./fonts/JetBrainsMono-Regular.ttf?inline";
import jbmBoldInline from "./fonts/JetBrainsMono-Bold.ttf?inline";
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
 * Every glyph appearing in the node tree that needs the CJK fallback font,
 * deduped. JSON.stringify escapes control characters, so what remains outside
 * printable ASCII is the non-ASCII set; box-drawing characters (U+2500–U+257F,
 * e.g. the `─` / `═` ASCII rules) are dropped because JetBrains Mono already
 * covers them — only the CJK-and-friends glyphs actually need Noto Sans TC.
 */
export function collectNonAsciiGlyphs(node: OgNode): string {
  const matches = JSON.stringify(node).match(/[^ -~]/g) ?? [];
  const needsCjk = matches.filter((c) => {
    const cp = c.codePointAt(0) ?? 0;
    return cp < 0x2500 || cp > 0x257f;
  });
  return [...new Set(needsCjk)].join("");
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

function decodeDataUri(uri: string): ArrayBuffer {
  const base64 = uri.slice(uri.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

let bundledFonts: OgFont[] | null = null;

/** JetBrains Mono decoded from the inlined build-time assets, once per isolate. */
export function loadBundledFonts(): OgFont[] {
  bundledFonts ??= [
    { name: "JetBrains Mono", data: decodeDataUri(jbmRegularInline), weight: 400, style: "normal" },
    { name: "JetBrains Mono", data: decodeDataUri(jbmBoldInline), weight: 700, style: "normal" },
  ];
  return bundledFonts;
}

/** The full font set for one render: bundled mono + CJK subsets for `text`. */
export async function loadOgFonts(node: OgNode, fetchFn: FetchFn = fetch): Promise<OgFont[]> {
  const glyphs = collectNonAsciiGlyphs(node);
  const [cjkRegular, cjkBold] = await Promise.all([
    loadCjkSubset(glyphs, 400, fetchFn),
    loadCjkSubset(glyphs, 700, fetchFn),
  ]);
  return [...loadBundledFonts(), ...[cjkRegular, cjkBold].filter((f): f is OgFont => f !== null)];
}
