// @vitest-environment node
//
// The three crawler-facing text endpoints. Their bodies are built and tested in
// server/{sitemap,llms,feed}; the route's own job is the content type and the
// cache window, which is exactly what silently breaks when a header is edited.
// Reached the same way as the /mcp route: straight off `Route.options`, no Start
// plugin and no router harness involved.
import { beforeEach, describe, expect, it, vi } from "vitest";

const buildSitemapXml = vi.fn();
const buildLlmsTxt = vi.fn();
const buildFeedXml = vi.fn();
vi.mock("@/server/sitemap", () => ({ buildSitemapXml: () => buildSitemapXml() }));
vi.mock("@/server/llms", () => ({ buildLlmsTxt: () => buildLlmsTxt() }));
vi.mock("@/server/feed", () => ({ buildFeedXml: () => buildFeedXml() }));

const { Route: SitemapRoute } = await import("@/routes/sitemap[.]xml");
const { Route: LlmsRoute } = await import("@/routes/llms[.]txt");
const { Route: FeedRoute } = await import("@/routes/feed[.]xml");

type Handlers = Record<string, (ctx: { request: Request }) => Response | Promise<Response>>;

function get(route: { options: unknown }) {
  return (route.options as { server: { handlers: Handlers } }).server.handlers.GET;
}

beforeEach(() => {
  buildSitemapXml.mockResolvedValue("<urlset />");
  buildLlmsTxt.mockResolvedValue("# laigary.com");
  buildFeedXml.mockResolvedValue("<rss />");
});

const CACHE = "public, max-age=3600";

describe("crawler text endpoints", () => {
  it("serves /sitemap.xml as xml built by the sitemap builder", async () => {
    const res = await get(SitemapRoute)({
      request: new Request("http://test.local/sitemap.xml"),
    });

    expect(res.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe(CACHE);
    expect(await res.text()).toBe("<urlset />");
  });

  it("serves /llms.txt as plain text", async () => {
    const res = await get(LlmsRoute)({ request: new Request("http://test.local/llms.txt") });

    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe(CACHE);
    expect(await res.text()).toBe("# laigary.com");
  });

  it("serves /feed.xml as an rss content type, not generic xml", async () => {
    const res = await get(FeedRoute)({ request: new Request("http://test.local/feed.xml") });

    expect(res.headers.get("Content-Type")).toBe("application/rss+xml; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe(CACHE);
    expect(await res.text()).toBe("<rss />");
  });
});
