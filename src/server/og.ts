import { OG_DESIGN_VERSION } from "@/lib/og/version";
import { getContentVersion } from "@/db/queries/_revalidate";
// Shared handler plumbing for the /api/og* server routes: build the node tree,
// load fonts, render, and cache the finished PNG in the Workers Cache API so
// repeat crawler hits skip the ~100-300ms CPU render entirely.

import { loadOgFonts } from "@/lib/og/fonts";
import { renderOgPng } from "@/lib/og/render";
import type { OgNode } from "@/lib/og/templates";
import { getSiteSettings, getNextScheduledPublishAt } from "@/db/queries";

const DEFAULT_SITE_NAME = "Gary Lai";
const DEFAULT_SITE_URL = "laigary.com";

export interface SiteBranding {
  siteName: string;
  description: string;
  siteUrl: string;
  branding: string;
}

export async function getSiteBranding(): Promise<SiteBranding> {
  const s = await getSiteSettings();
  const siteName = s.site_name || DEFAULT_SITE_NAME;
  const siteUrl = s.site_url || DEFAULT_SITE_URL;
  return {
    siteName,
    siteUrl,
    description: s.site_description || "",
    branding: `${siteName} | ${siteUrl}`,
  };
}

const CACHE_SECONDS = 3600;

export async function serveOgImage(
  request: Request,
  buildNode: (branding: SiteBranding) => Promise<OgNode>,
): Promise<Response> {
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheUrl = new URL(request.url);
  cacheUrl.search = "";
  cacheUrl.searchParams.set("design", OG_DESIGN_VERSION);
  cacheUrl.searchParams.set("content", await getContentVersion());
  const cacheKey = cacheUrl.toString();
  const cached = await cache?.match(cacheKey);
  if (cached) return cached;

  const node = await buildNode(await getSiteBranding());
  const fonts = await loadOgFonts(node);
  const png = await renderOgPng(node, fonts);

  const nextPublish = await getNextScheduledPublishAt();
  const ttl =
    nextPublish === null
      ? CACHE_SECONDS
      : Math.min(CACHE_SECONDS, Math.max(1, nextPublish - Math.floor(Date.now() / 1000)));
  const response = new Response(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png", "Cache-Control": `public, max-age=${ttl}` },
  });
  await cache?.put(cacheKey, response.clone());
  return response;
}
