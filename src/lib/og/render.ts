// satori (VNode tree -> SVG) + resvg (SVG -> PNG), both wasm-backed so they
// run on Cloudflare Workers. Kept separate from the pure template/font modules
// because the .wasm imports only resolve in the worker build, not under vitest.

// The standalone build is required on Workers: satori's main entry embeds
// yoga.wasm as base64 and compiles it at runtime, which workerd forbids.
import satori, { init as initSatori } from "satori/standalone";
import { Resvg, initWasm as initResvg } from "@resvg/resvg-wasm";

import yogaWasm from "satori/yoga.wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";

import type { OgFont } from "./fonts";
import { OG_HEIGHT, OG_WIDTH, type OgNode } from "./templates";

let initPromise: Promise<void> | null = null;

function ensureInit(): Promise<void> {
  initPromise ??= Promise.all([
    initSatori(yogaWasm),
    // Tolerate re-init: dev HMR re-evaluates this module while the optimized
    // resvg dep keeps its internal "already initialized" flag.
    initResvg(resvgWasm).catch((error: unknown) => {
      if (error instanceof Error && error.message.includes("Already initialized")) return;
      throw error;
    }),
  ]).then(() => undefined);
  return initPromise;
}

export async function renderOgPng(node: OgNode, fonts: OgFont[]): Promise<Uint8Array> {
  await ensureInit();
  // satori's ReactNode input is structurally compatible with our OgNode shape.
  const svg = await satori(node as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } });
  return resvg.render().asPng();
}
