// Exercise the built bundle in workerd: mocked renderer tests cannot catch Wasm
// runtime regressions. Uses an isolated local D1, never production credentials.
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import assert from "node:assert/strict";

const directory = mkdtempSync(join(tmpdir(), "og-smoke-"));
const config = "dist/server/wrangler.json";
const persist = join(directory, "state");
const common = ["--config", config, "--persist-to", persist];
function wrangler(args: string[]) {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
}
// Ask the OS for an available port so this can run alongside pnpm dev.
const socket = createServer();
await new Promise<void>((resolve) => socket.listen(0, "127.0.0.1", resolve));
const address = socket.address();
assert(address && typeof address !== "string");
const port = address.port;
await new Promise<void>((resolve) => socket.close(() => resolve()));
let worker: ReturnType<typeof spawn> | undefined;
let logs = "";
try {
  wrangler(["d1", "migrations", "apply", "laigary-db", "--local", ...common]);
  const sql = join(directory, "seed.sql");
  writeFileSync(
    sql,
    `INSERT INTO posts (id, slug, title, content_md, status, published_at) VALUES ('og-smoke', 'og-smoke', 'Building thoughtful web applications', 'Example', 'published', 1700000000);`,
  );
  wrangler(["d1", "execute", "laigary-db", "--local", ...common, "--file", sql]);
  worker = spawn("pnpm", ["exec", "wrangler", "dev", ...common, "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Worker startup timed out\n${logs}`)),
      30_000,
    );
    const output = (chunk: Buffer) => {
      logs += chunk.toString();
      if (logs.includes("Ready on")) {
        clearTimeout(timeout);
        resolve();
      }
    };
    worker!.stdout!.on("data", output);
    worker!.stderr!.on("data", output);
    worker!.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Worker exited ${code}\n${logs}`));
    });
  });
  // The document cache must be wired to the build too, not only the OG routes.
  let buildId: string | null = null;
  for (const path of ["/", "/posts/og-smoke.md"]) {
    for (const expected of ["MISS", "HIT"]) {
      const response = await fetch(`http://localhost:${port}${path}`, {
        signal: AbortSignal.timeout(20_000),
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("x-edge-cache"), expected);
      const servingBuild = response.headers.get("x-site-build");
      assert.match(servingBuild ?? "", /^[0-9a-f-]{36}$/);
      if (buildId !== null) assert.equal(servingBuild, buildId);
      buildId = servingBuild;
      assert.match(response.headers.get("cache-control") ?? "", /max-age=0/);
      await response.arrayBuffer();
    }
  }
  console.log(`Document cache smoke passed for build ${buildId}`);
  for (const path of ["/api/og", "/api/og/posts/og-smoke", "/api/og/posts/og-smoke?v=cached"]) {
    const response = await fetch(`http://localhost:${port}${path}`, {
      signal: AbortSignal.timeout(20_000),
    });
    assert.equal(
      response.status,
      200,
      `${path}: ${await (response.ok ? Promise.resolve("") : response.text())}\n${logs}`,
    );
    assert.equal(response.headers.get("content-type"), "image/png");
    const png = Buffer.from(await response.arrayBuffer());
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
    assert(png.length > 5000, "Expected a rendered card, not an empty image");
    console.log(`OG smoke passed: ${path} (${png.length} bytes)`);
  }
} finally {
  if (worker?.pid && worker.exitCode === null && worker.signalCode === null) {
    const closed = new Promise<void>((resolve) => worker!.once("exit", () => resolve()));
    process.kill(-worker.pid, "SIGTERM");
    await closed;
  }
  rmSync(directory, { recursive: true, force: true });
}
