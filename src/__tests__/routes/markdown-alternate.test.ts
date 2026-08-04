// @vitest-environment node
//
// Every content detail route must declare its markdown twin. The endpoint that
// serves those URLs is tested in server/md; this is the other half — a page
// that does not advertise the alternate is a document no agent finds without
// being told the convention, and the four routes wire it up independently.
import { describe, expect, it, vi } from "vitest";

// The route modules pull the server-fn barrel and the devtools in through their
// component graph; none of that is exercised by reading `head` off the options.
vi.mock("@/lib/og/render", () => ({ renderOgPng: vi.fn() }));
vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtoolsPanel: () => null }));

type HeadOut = { links: Record<string, string>[] };

async function head(importRoute: Promise<unknown>, loaderData: unknown): Promise<HeadOut> {
  const { Route } = (await importRoute) as {
    Route: { options: { head: (arg: { loaderData: unknown }) => HeadOut } };
  };
  return Route.options.head({ loaderData });
}

function alternate(out: HeadOut) {
  return out.links.find((link) => link.rel === "alternate");
}

const chrome = { html: "", toc: [], description: "d", pageTitle: "T", siteName: "Unconstrained" };

describe("markdown alternate links", () => {
  it("should point a post at its own url plus .md when the loader has resolved", async () => {
    const out = await head(import("@/routes/_site/posts/$slug"), {
      ...chrome,
      post: {
        slug: "hello",
        title: "Hello",
        date: "2026-01-01",
        updatedAt: "2026-01-02",
        tags: [],
      },
      adjacent: { prev: null, next: null },
    });

    expect(alternate(out)).toEqual({
      rel: "alternate",
      type: "text/markdown",
      href: "https://laigary.com/posts/hello.md",
    });
  });

  it("should point a work at its own url plus .md when the loader has resolved", async () => {
    const out = await head(import("@/routes/_site/works/$slug"), {
      ...chrome,
      work: {
        slug: "laigary",
        title: "laigary.com",
        year: 2025,
        endYear: null,
        date: "2026-01-01",
        updatedAt: "2026-01-02",
        coverImageUrl: null,
        tags: [],
      },
    });

    expect(alternate(out)?.href).toBe("https://laigary.com/works/laigary.md");
  });

  it("should point a page at its own url plus .md when the loader has resolved", async () => {
    const out = await head(import("@/routes/_site/$slug"), {
      ...chrome,
      page: { slug: "about", title: "About", updatedAt: "2026-01-02" },
    });

    expect(alternate(out)?.href).toBe("https://laigary.com/about.md");
  });

  it("should point a note at its section path plus .md when the loader has resolved", async () => {
    const out = await head(import("@/routes/interview/$section/$slug"), {
      ...chrome,
      note: {
        slug: "two-sum",
        section: "coding",
        title: "Two Sum",
        date: "2026-01-01",
        updatedAt: "2026-01-02",
        tags: [],
      },
    });

    expect(alternate(out)?.href).toBe("https://laigary.com/interview/coding/two-sum.md");
  });

  // Literal specifiers, not a variable one: only a static `import("@/…")` goes
  // through vitest's alias, and a computed id hangs the resolver instead.
  it.each([
    ["post", () => import("@/routes/_site/posts/$slug")],
    ["work", () => import("@/routes/_site/works/$slug")],
    ["page", () => import("@/routes/_site/$slug")],
    ["note", () => import("@/routes/interview/$section/$slug")],
  ] as const)(
    "should declare no links on the %s route before the loader has resolved",
    async (_, load) => {
      // `head` runs against undefined loaderData on the way in, and each route
      // guards that itself — an alternate built from a bare property access
      // would take the route down. All four, because the guard is written four
      // times and a missed one only fails on the way into that one page.
      const out = await head(load(), undefined);

      expect(out.links).toEqual([]);
    },
  );
});
