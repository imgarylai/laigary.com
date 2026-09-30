// @vitest-environment node
//
// Handler plumbing behind the /api/og* routes. The template and font modules
// have their own tests; what this pins down is the branding fallback chain and
// the Workers Cache API short-circuit — a cache hit must skip the ~100-300ms
// satori render entirely, and a runtime without `caches` must still serve.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OgNode } from "@/lib/og/templates";
import { getSiteBranding, serveOgImage } from "@/server/og";

const getContentVersion = vi.fn(() => Promise.resolve("7"));
vi.mock("@/db/queries/_revalidate", () => ({ getContentVersion: () => getContentVersion() }));
const cacheKey = "http://test.local/api/og/posts/hello?design=editorial-1&content=7";
const getSiteSettings = vi.fn();
const getNextScheduledPublishAt = vi.fn(() => Promise.resolve<number | null>(null));
vi.mock("@/db/queries", () => ({
  getSiteSettings: () => getSiteSettings(),
  getNextScheduledPublishAt: () => getNextScheduledPublishAt(),
}));

const loadOgFonts = vi.fn();
vi.mock("@/lib/og/fonts", () => ({ loadOgFonts: (node: OgNode) => loadOgFonts(node) }));

const renderOgPng = vi.fn();
vi.mock("@/lib/og/render", () => ({
  renderOgPng: (node: OgNode, fonts: unknown) => renderOgPng(node, fonts),
}));

const node = { type: "div", props: {} } as unknown as OgNode;
const request = new Request("http://test.local/api/og/posts/hello");

beforeEach(() => {
  getSiteSettings.mockResolvedValue({});
  loadOgFonts.mockResolvedValue([{ name: "Lato", data: new Uint8Array(), weight: 400 }]);
  renderOgPng.mockResolvedValue(new Uint8Array([137, 80, 78, 71]));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getSiteBranding", () => {
  it("falls back to the built-in name and url when settings are empty", async () => {
    await expect(getSiteBranding()).resolves.toEqual({
      siteName: "Gary Lai",
      siteUrl: "laigary.com",
      description: "",
      branding: "Gary Lai | laigary.com",
    });
  });

  it("prefers configured settings and composes the branding line from them", async () => {
    getSiteSettings.mockResolvedValue({
      site_name: "Gary's Blog",
      site_url: "blog.example",
      site_description: "notes",
    });

    await expect(getSiteBranding()).resolves.toEqual({
      siteName: "Gary's Blog",
      siteUrl: "blog.example",
      description: "notes",
      branding: "Gary's Blog | blog.example",
    });
  });

  it("treats a blank stored value as unset rather than rendering an empty line", async () => {
    getSiteSettings.mockResolvedValue({ site_name: "", site_url: "" });

    const branding = await getSiteBranding();
    expect(branding.branding).toBe("Gary Lai | laigary.com");
  });
});

describe("serveOgImage", () => {
  function stubCache(hit: Response | undefined) {
    // Typed params so the call-tuple assertions below have something to index.
    const match = vi.fn(async (_url: string) => hit);
    const put = vi.fn(async (_url: string, _res: Response) => {});
    vi.stubGlobal("caches", { default: { match, put } });
    return { match, put };
  }

  it("renders a png with cache headers and stores it on a cache miss", async () => {
    const { match, put } = stubCache(undefined);

    const res = await serveOgImage(request, async () => node);

    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(match).toHaveBeenCalledWith(cacheKey);
    expect(put).toHaveBeenCalledOnce();
    expect(put.mock.calls[0][0]).toBe(cacheKey);
  });

  it("should change the cache key when content is republished", async () => {
    const { match } = stubCache(undefined);
    await serveOgImage(request, async () => node);
    getContentVersion.mockResolvedValueOnce("8");
    await serveOgImage(request, async () => node);
    expect(match.mock.calls.map((call) => call[0])).toEqual([
      cacheKey,
      cacheKey.replace("content=7", "content=8"),
    ]);
  });
  it("should share a cache entry when only arbitrary query parameters differ", async () => {
    const { match } = stubCache(undefined);
    await serveOgImage(new Request(`${request.url}?v=old&noise=123`), async () => node);
    expect(match).toHaveBeenCalledWith(cacheKey);
  });
  it("should expire the image when the next scheduled publication is due", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    getNextScheduledPublishAt.mockResolvedValueOnce(1700000030);
    const response = await serveOgImage(request, async () => node);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=30");
  });
  it("passes the built node through to the font loader and the renderer", async () => {
    stubCache(undefined);

    await serveOgImage(request, async () => node);

    expect(loadOgFonts).toHaveBeenCalledWith(node);
    expect(renderOgPng).toHaveBeenCalledWith(node, await loadOgFonts.mock.results[0].value);
  });

  it("hands the resolved branding to the node builder", async () => {
    stubCache(undefined);
    getSiteSettings.mockResolvedValue({ site_name: "Gary's Blog", site_url: "blog.example" });
    const buildNode = vi.fn(async () => node);

    await serveOgImage(request, buildNode);

    expect(buildNode).toHaveBeenCalledWith(
      expect.objectContaining({ branding: "Gary's Blog | blog.example" }),
    );
  });

  it("returns the cached response without rendering on a cache hit", async () => {
    stubCache(new Response("cached", { headers: { "Content-Type": "image/png" } }));

    const res = await serveOgImage(request, async () => node);

    expect(await res.text()).toBe("cached");
    expect(renderOgPng).not.toHaveBeenCalled();
    expect(getSiteSettings).not.toHaveBeenCalled();
  });

  it("still serves where no Cache API exists", async () => {
    // `caches` is a Workers global; under vitest (and in `wrangler dev --local`
    // edge cases) it is simply absent, and the handler must not reach for it.
    const res = await serveOgImage(request, async () => node);

    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(renderOgPng).toHaveBeenCalledOnce();
  });
});
