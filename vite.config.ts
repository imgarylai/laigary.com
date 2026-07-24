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

// Rolldown's code generator (Vite 8's bundler) cannot emit a *lone* surrogate:
// temml's tokenizer builds its regex from string literals containing `\uD800`
// and friends, and those came out of the bundle as U+FFFD followed by the text
// "d800". The resulting class `[�d800-�dbff]` spans `0`–U+FFFD, which
// swallows the backslash — so it out-matched the control-word alternative and
// every LaTeX command lexed as a single letter (`\times` → `\t` + "imes"),
// silently breaking all multi-letter math on the site.
//
// Rewrite those literals to build the surrogates at runtime, where codegen
// never has to encode them. Throws if temml's source stops matching, so a
// dependency bump can't quietly reintroduce the corruption.
function temmlSurrogateFix(): Plugin {
  const cc = (code: number) => `String.fromCharCode(${code})`;
  // Source fragments as they appear in temml's dist build.
  const SYMBOL = '"\\\\\\\\[^\\uD800-\\uDFFF]"';
  const PAIR = '"|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]"';
  return {
    name: "temml-surrogate-fix",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("temml") || !code.includes("tokenRegexString")) return;
      if (!code.includes(SYMBOL) || !code.includes(PAIR)) {
        throw new Error(
          "temml-surrogate-fix: temml's lexer source no longer matches — re-check this workaround",
        );
      }
      return {
        code: code
          .replace(SYMBOL, `"\\\\\\\\[^" + ${cc(0xd800)} + "-" + ${cc(0xdfff)} + "]"`)
          .replace(
            PAIR,
            `"|[" + ${cc(0xd800)} + "-" + ${cc(0xdbff)} + "][" + ${cc(0xdc00)} + "-" + ${cc(0xdfff)} + "]"`,
          ),
        map: null,
      };
    },
  };
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // temml is bundled from source rather than pre-bundled, so the plugin below
  // can rewrite it before Rolldown's code generator sees it.
  optimizeDeps: { exclude: ["temml"] },
  environments: { ssr: { optimizeDeps: { exclude: ["temml"] } } },
  plugins: [
    temmlSurrogateFix(),
    clientCloudflareEnvStub(),
    devtools(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
