import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Impl tests cannot catch a wrapper that forgets auth. Admin wrappers are
// deliberately simple fluent declarations; inspect each through its semicolon,
// including declarations in new modules, without Start's private runtime hooks.
const directory = new URL("../../../server/admin/", import.meta.url);
const endpoints = readdirSync(directory)
  .filter((name) => name.endsWith(".ts"))
  .flatMap((filename) => {
    const source = readFileSync(new URL(filename, directory), "utf8");
    return [...source.matchAll(/export const (\w+) = (createServerFn\([\s\S]*?);/g)].map(
      ([, name, declaration]) => ({ name: `${filename}:${name}`, declaration }),
    );
  });

describe("admin RPC authorization coverage", () => {
  it("should discover endpoints when scanning the admin server modules", () => {
    expect(endpoints.length).toBeGreaterThan(0);
  });

  it.each(endpoints)(
    "should require authorization when $name exposes an RPC",
    ({ declaration }) => {
      expect(declaration).toMatch(/\.middleware\(\[requireAdmin\]\)/);
    },
  );
});
