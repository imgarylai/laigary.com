// The deploy leg only runs on main, so when this broke it broke silently: every
// `alchemy deploy` died with `fetch failed` for a day before anyone looked.
//
// alchemy's safeFetch does `await import("undici")` and hands `new Agent()` to
// Node's fetch as its dispatcher, but undici is only a *devDependency* of
// alchemy — so at runtime that bare import resolves through whatever pnpm
// hoisted. Bumping jsdom to v30 put undici 8 in the tree, it won the hoist, and
// undici 8 rejects the v7-shaped handler Node's built-in fetch passes down:
// `InvalidArgumentError: invalid onRequestStart method`. pnpm-workspace.yaml now
// pins an undici inside alchemy's own node_modules; this checks it stayed there
// and stayed on the major alchemy develops against, so the next dependency bump
// that moves it fails here instead of on main.

import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";

const alchemyManifest = join(process.cwd(), "node_modules/alchemy/package.json");

/** The undici alchemy's own `import("undici")` lands on, as a major version. */
function resolvedUndiciMajor(): number {
  const alchemyDir = dirname(realpathSync(alchemyManifest));
  // Resolve from the module that actually imports it, so this follows the same
  // lookup chain Node uses at deploy time rather than the repo root's.
  const requireFromAlchemy = createRequire(join(alchemyDir, "lib/util/safe-fetch.js"));
  const manifest = requireFromAlchemy.resolve("undici/package.json");
  return Number(JSON.parse(readFileSync(manifest, "utf8")).version.split(".")[0]);
}

/** The undici major alchemy itself is built and tested against. */
function expectedUndiciMajor(): number {
  const range = JSON.parse(readFileSync(alchemyManifest, "utf8")).devDependencies.undici as string;
  return Number(range.replace(/^\D*/, "").split(".")[0]);
}

describe("alchemy's undici", () => {
  it("should resolve to the major alchemy develops against", () => {
    // Not a hardcoded 7: when alchemy moves to the next undici, this points at
    // the pin in pnpm-workspace.yaml being stale rather than at undici itself.
    expect(resolvedUndiciMajor()).toBe(expectedUndiciMajor());
  });

  it("should dispatch a real request through the version it resolves", async () => {
    // The assertion that actually failed in CI. undici 8 throws
    // UND_ERR_INVALID_ARG here before a byte leaves the process.
    const { createServer } = await import("node:http");
    const server = createServer((_req, res) => res.end("ok"));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as { port: number }).port;

    const alchemyDir = dirname(realpathSync(alchemyManifest));
    const requireFromAlchemy = createRequire(join(alchemyDir, "lib/util/safe-fetch.js"));
    const { Agent } = (await import(requireFromAlchemy.resolve("undici"))) as {
      Agent: new (opts: { pipelining: number }) => unknown;
    };

    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, {
        // Same option alchemy's safeFetch passes; typed loosely because
        // `dispatcher` is undici's extension to RequestInit.
        dispatcher: new Agent({ pipelining: 0 }),
      } as RequestInit);

      expect(res.status).toBe(200);
    } finally {
      server.close();
    }
  });
});
