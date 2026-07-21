/**
 * Spike: OG image generation on Cloudflare Workers with satori + resvg-wasm
 * (no workers-og — see issue #2 discussion).
 *
 * Routes:
 *   GET /?type=site
 *   GET /?type=post&title=...&date=<unix-seconds>
 *   GET /?type=note&title=...&sect=...&date=<unix-seconds>
 *   Optional: &svg=1 returns the intermediate SVG (isolates satori cost from resvg cost)
 *
 * Response headers expose per-phase wall timings (X-Timing). Note: in production
 * Workers, Date.now() only advances at I/O boundaries, so CPU-bound phases will
 * read ~0 there — use `wrangler tail --format json` (cpuTime) for real CPU numbers.
 */
import satori, { init as initSatori } from "satori";
import { Resvg, initWasm as initResvg } from "@resvg/resvg-wasm";

import yogaWasm from "satori/yoga.wasm";
// index_bg.wasm is not in the package's export map; reach into node_modules directly.
import resvgWasm from "../node_modules/@resvg/resvg-wasm/index_bg.wasm";
import jbmRegular from "../fonts/JetBrainsMono-Regular.ttf";
import jbmBold from "../fonts/JetBrainsMono-Bold.ttf";

interface VNode {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
}

function h(type: string, props: Record<string, unknown>, ...children: unknown[]): VNode {
  return {
    type,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  };
}

let initialized: Promise<void> | null = null;

function ensureInit(): Promise<void> {
  initialized ??= Promise.all([initSatori(yogaWasm), initResvg(resvgWasm)]).then(() => undefined);
  return initialized;
}

/**
 * Fetch a per-request glyph subset of Noto Sans TC from Google Fonts.
 * The legacy Safari 5 UA forces Google to serve TTF (satori cannot parse woff/woff2).
 */
async function loadNotoSansTC(text: string, weight: 400 | 700): Promise<ArrayBuffer | null> {
  const uniq = [...new Set(text)].join("");
  if (!uniq) return null;
  const cssUrl =
    `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@${weight}` +
    `&text=${encodeURIComponent(uniq)}`;
  const cssRes = await fetch(cssUrl, {
    headers: {
      // Safari 5 predates woff support, so Google serves plain TTF (satori
      // cannot parse woff2, and newer UAs get woff/woff2).
      "User-Agent":
        "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
    },
  });
  if (!cssRes.ok) return null;
  const css = await cssRes.text();
  const match = css.match(/src:\s*url\((.+?)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/);
  if (!match) return null;
  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) return null;
  return fontRes.arrayBuffer();
}

const MONO = "JetBrains Mono, Noto Sans TC";

function siteTemplate(siteName: string, description: string, siteUrl: string): VNode {
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
        fontFamily: MONO,
      },
    },
    h("div", { style: { fontSize: 64, fontWeight: 700, letterSpacing: "-0.02em" } }, siteName),
    h("div", { style: { fontSize: 28, color: "#a1a1aa", marginTop: 16 } }, description),
    h("div", { style: { fontSize: 20, color: "#52525b", marginTop: 8 } }, siteUrl),
  );
}

function articleTemplate(opts: {
  title: string;
  branding: string;
  dateLabel: string | null;
  kicker: string | null;
}): VNode {
  const { title, branding, dateLabel, kicker } = opts;
  const children: VNode[] = [];
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
        fontFamily: MONO,
        padding: 80,
      },
    },
    ...children,
  );
}

function formatDate(unixSeconds: string | null): string | null {
  if (!unixSeconds) return null;
  const ms = Number(unixSeconds) * 1000;
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const SITE_NAME = "啟靈工程師";
const SITE_URL = "laigary.com";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/") return new Response("not found", { status: 404 });

    const type = url.searchParams.get("type") ?? "site";
    const title = url.searchParams.get("title") ?? "Untitled";
    const sect = url.searchParams.get("sect") ?? "general";
    const dateLabel = formatDate(url.searchParams.get("date"));
    const branding = `${SITE_NAME} | ${SITE_URL}`;

    const timings: Record<string, number> = {};
    let t = Date.now();
    const mark = (name: string): void => {
      timings[name] = Date.now() - t;
      t = Date.now();
    };

    await ensureInit();
    mark("init");

    let node: VNode;
    if (type === "site") {
      node = siteTemplate(SITE_NAME, "A blog about engineering and psychedelics", SITE_URL);
    } else if (type === "post") {
      node = articleTemplate({ title, branding, dateLabel, kicker: null });
    } else {
      node = articleTemplate({ title, branding, dateLabel, kicker: `./interview/${sect}/` });
    }

    // Collect every non-ASCII glyph rendered, fetch a CJK subset covering exactly those.
    const allText = (JSON.stringify(node).match(/[^ -~]/g) ?? []).join("");
    const [notoRegular, notoBold] = await Promise.all([
      loadNotoSansTC(allText, 400),
      loadNotoSansTC(allText, 700),
    ]);
    mark("cjk-font-fetch");

    const fonts = [
      { name: "JetBrains Mono", data: jbmRegular, weight: 400 as const, style: "normal" as const },
      { name: "JetBrains Mono", data: jbmBold, weight: 700 as const, style: "normal" as const },
      ...(notoRegular
        ? [
            {
              name: "Noto Sans TC",
              data: notoRegular,
              weight: 400 as const,
              style: "normal" as const,
            },
          ]
        : []),
      ...(notoBold
        ? [{ name: "Noto Sans TC", data: notoBold, weight: 700 as const, style: "normal" as const }]
        : []),
    ];

    // satori's ReactNode type is structurally compatible with our VNode shape.
    const svg = await satori(node as never, { width: 1200, height: 630, fonts });
    mark("satori");

    if (url.searchParams.get("svg") === "1") {
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "X-Timing": JSON.stringify(timings),
        },
      });
    }

    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
    const png = resvg.render().asPng();
    mark("resvg");

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "X-Timing": JSON.stringify(timings),
      },
    });
  },
};
