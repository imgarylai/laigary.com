import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGoogleFontsCssUrl,
  collectNonAsciiGlyphs,
  loadBundledFonts,
  loadCjkSubset,
  loadOgFonts,
  parseTruetypeUrl,
} from "@/lib/og/fonts";
import { siteTemplate } from "@/lib/og/templates";

afterEach(() => {
  vi.restoreAllMocks();
});

const ttfBytes = () => new Uint8Array([0, 1, 0, 0]).buffer;

function okResponse(body: string | ArrayBuffer): Response {
  return new Response(body, { status: 200 });
}

describe("collectNonAsciiGlyphs", () => {
  it("should return only deduped non-ascii glyphs when the tree mixes scripts", () => {
    const node = siteTemplate({
      siteName: "啟靈啟靈",
      description: "plain ascii",
      siteUrl: "laigary.com",
    });
    const glyphs = collectNonAsciiGlyphs(node);
    expect(glyphs).toBe("啟靈");
  });

  it("should return an empty string when the tree is ascii-only", () => {
    const node = siteTemplate({ siteName: "a", description: "b", siteUrl: "c" });
    expect(collectNonAsciiGlyphs(node)).toBe("");
  });
});

describe("buildGoogleFontsCssUrl", () => {
  it("should encode family and text when building the url", () => {
    const url = buildGoogleFontsCssUrl("Noto Sans TC", 700, "啟");
    expect(url).toBe(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=%E5%95%9F",
    );
  });
});

describe("parseTruetypeUrl", () => {
  it("should extract the url when the css declares a truetype source", () => {
    const css = "src: url(https://fonts.gstatic.com/l/font?kit=abc) format('truetype');";
    expect(parseTruetypeUrl(css)).toBe("https://fonts.gstatic.com/l/font?kit=abc");
  });

  it("should return null when only woff sources are present", () => {
    const css = "src: url(https://fonts.gstatic.com/f.woff) format('woff');";
    expect(parseTruetypeUrl(css)).toBeNull();
  });
});

describe("loadCjkSubset", () => {
  it("should return null when text is empty without fetching", async () => {
    const fetchFn = vi.fn();
    expect(await loadCjkSubset("", 400, fetchFn)).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("should fetch css then font bytes when text is present", async () => {
    const fetchFn = vi
      .fn<(input: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(
        okResponse("src: url(https://fonts.gstatic.com/l/f) format('truetype');"),
      )
      .mockResolvedValueOnce(okResponse(ttfBytes()));
    const font = await loadCjkSubset("啟", 700, fetchFn);
    if (!font) throw new Error("expected a font");
    expect(font).toMatchObject({ name: "Noto Sans TC", weight: 700, style: "normal" });
    expect(font.data.byteLength).toBe(4);
    // css2 request must force a TTF response via a pre-woff UA
    const init = fetchFn.mock.calls[0][1];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers["User-Agent"]).toContain("Safari");
  });

  it("should return null when the css response is not ok", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("nope", { status: 403 }));
    expect(await loadCjkSubset("啟", 400, fetchFn)).toBeNull();
  });
});

describe("loadBundledFonts", () => {
  it("should decode both weights from the inlined assets when called", () => {
    const fonts = loadBundledFonts();
    expect(fonts.map((f) => f.weight)).toEqual([400, 700]);
    // real TTFs: sfnt version 0x00010000 in the first four bytes
    const head = new Uint8Array(fonts[0].data.slice(0, 4));
    expect([...head]).toEqual([0, 1, 0, 0]);
    expect(fonts[0].data.byteLength).toBeGreaterThan(100_000);
  });

  it("should return the same cached array when called twice", () => {
    expect(loadBundledFonts()).toBe(loadBundledFonts());
  });
});

describe("loadOgFonts", () => {
  it("should skip cjk fonts when the tree is ascii-only", async () => {
    const fetchFn = vi.fn(async () => okResponse(ttfBytes()));
    const node = siteTemplate({ siteName: "a", description: "b", siteUrl: "c" });
    const fonts = await loadOgFonts(node, fetchFn);
    expect(fonts.map((f) => f.name)).toEqual(["JetBrains Mono", "JetBrains Mono"]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("should append cjk subsets when the tree contains cjk glyphs", async () => {
    const fetchFn = vi.fn(async (input: string) =>
      input.includes("css2")
        ? okResponse("src: url(https://fonts.gstatic.com/l/f) format('truetype');")
        : okResponse(ttfBytes()),
    );
    const node = siteTemplate({ siteName: "啟靈", description: "b", siteUrl: "c" });
    const fonts = await loadOgFonts(node, fetchFn);
    expect(fonts.map((f) => f.name)).toEqual([
      "JetBrains Mono",
      "JetBrains Mono",
      "Noto Sans TC",
      "Noto Sans TC",
    ]);
  });
});
