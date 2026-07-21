import { defineConfig, type Plugin } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// The `cloudflare:workers` virtual module (worker env / bindings) is only
// provided by @cloudflare/vite-plugin in the `ssr` environment. Server
// functions that touch D1/R2 (db/queries/_db.ts, server/admin/r2-env.ts) import
// it; when those functions are also imported by client components (e.g. the
// admin forms import the *Fn wrappers), the module graph reaches the client
// build, where the specifier can't resolve and the build hard-fails. On the
// client the server code is dead — createServerFn compiles handlers down to
// fetch stubs — so resolving `cloudflare:workers` to an empty module lets the
// client build succeed and tree-shake the server code away. The real binding is
// untouched: this alias never applies to the `ssr` environment.
function clientCloudflareEnvStub(): Plugin {
  const VIRTUAL = "\0cloudflare-workers-client-stub";
  return {
    name: "cloudflare-workers-client-stub",
    enforce: "pre",
    resolveId(id) {
      if (id === "cloudflare:workers" && this.environment?.name !== "ssr") return VIRTUAL;
    },
    load(id) {
      if (id === VIRTUAL) return "export const env = {};";
    },
  };
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    clientCloudflareEnvStub(),
    devtools(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
