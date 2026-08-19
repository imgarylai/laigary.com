import { defineConfig, coverageConfigDefaults, type Plugin } from "vitest/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

const src = fileURLToPath(new URL("./src", import.meta.url));

// Pin the zone before any worker exists.
//
// `toLocaleDateString` reads the system zone, so a date assertion is otherwise
// machine-dependent — which is how formatOgDate came to be asserted as
// `/^2025年7月(19|20)日$/`, a regex that tolerates being a day out rather than
// pinning the day. UTC matches what CI already runs in.
//
// It has to be set HERE rather than through `test.env`: workers read the zone
// once, when they start, and under the threads pool that is the same process
// this config was evaluated in. `test.env` is applied inside the worker, too
// late for the already-initialised ICU — six date tests go red. Setting it at
// config scope runs before any worker spawns, so every pool sees it, including
// a bare `npx vitest`.
process.env.TZ = "UTC";

// A `?url` CSS import only resolves to a real asset URL once Vite has emitted
// the asset, which no test run does — so `import appCss from "./styles.css?url"`
// in __root evaluates to the empty string and the shell renders
// `<link rel="stylesheet" href="">`. React warns on an empty `href` once per
// render, which was 36 of the suite's console warnings and belongs to the test
// environment, not to __root: in a real build appCss is always a hashed URL.
// Hand back a plausible one instead of teaching product code to expect "".
//
// It has to redirect to a real `.ts` stub rather than `load()` the replacement
// in place: returning code for an id that still ends in `.css` leaves `vite:css`
// to transform it afterwards, which puts the empty string straight back.
function cssUrlStub(): Plugin {
  return {
    name: "css-url-stub",
    enforce: "pre",
    resolveId(id) {
      if (id.endsWith(".css?url")) return `${src}/__tests__/stubs/css-url.ts`;
    },
  };
}

export default defineConfig({
  plugins: [cssUrlStub(), react()],
  resolve: {
    alias: {
      "@": src,
      "#": src,
      // `cloudflare:workers` is a Workers-runtime virtual module; stub it so
      // unit tests can import from modules that reference Cloudflare bindings.
      "cloudflare:workers": `${src}/__tests__/stubs/cloudflare-workers.ts`,
    },
  },
  test: {
    // node by default; a file that needs a DOM opts in with
    // `// @vitest-environment happy-dom` on its first line. happy-dom rather
    // than jsdom because building one costs ~95ms against jsdom's ~240ms, and
    // with 88 DOM files that fixed cost, not the tests, is what the suite
    // spends its time on. Three files stay on jsdom where the two disagree on
    // DOM fidelity — each says why at the top.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Mock hygiene is global so no file has to hand-roll it — the version that
    // gets hand-rolled wrong fails silently. `vi.clearAllMocks()` in a local
    // beforeEach clears recorded CALLS but leaves the implementation installed,
    // so a one-off `mockRejectedValue` leaks into whichever test runs next
    // (#192 was exactly that, green only because the happy path was declared
    // first). `mockReset` restores a `vi.fn(impl)` to its original
    // implementation rather than blanking it, so `vi.mock` factories keep
    // working; `restoreMocks` undoes `vi.spyOn` so a stub cannot outlive the
    // test that installed it.
    mockReset: true,
    restoreMocks: true,
    // Workers, not child processes. The suite's cost is dominated by per-file
    // fixed overhead — building a DOM and re-importing the module graph — and
    // threads share a process, so both come out cheaper: measured 30.0s → 25.1s
    // on its own. The zone pin above is what makes this pool safe to use.
    pool: "threads",
    // Randomise both the file order and the order within each file, so a test
    // that depends on a sibling running first fails now instead of on whatever
    // future PR happens to reorder it. #192 was that bug, and it survived
    // because the happy-path test was declared before the one that poisoned the
    // mock. Vitest prints the seed on every run — pass it back via
    // `--sequence.seed=<n>` to replay an order exactly.
    sequence: { shuffle: { files: true, tests: true } },
    // jsdom has no layout, so ProseMirror's scroll-into-view throws from a
    // deferred rAF and fails the run as an unhandled error. See the file.
    setupFiles: ["src/__tests__/setup.ts"],
    coverage: {
      // text for the terminal summary, lcov for the Codecov upload in CI.
      reporter: ["text", "lcov"],
      // `include` MUST stay pinned to every authored source file. Without it,
      // v8 reports only the modules a run happened to import, so the DENOMINATOR
      // moves with the import graph: a PR that adds one test importing a module
      // nothing else touched pulls that whole file in at ~0% and drops project
      // coverage on files the PR never opened. Measured on this repo: a test
      // whose only assertion was `typeof uploadFile === "function"` took the
      // total from 94.83% to 93.76% while covered statements stayed at exactly
      // 1910 — the 2014 → 2037 denominator growth was the entire delta. That is
      // the Codecov drift; pinning the file set is the fix.
      include: ["src/**/*.{ts,tsx}"],
      // Keep coverage about code we author and can meaningfully test:
      //   - components/ui: shadcn/Base UI vendored primitives
      //   - db/schema: declarative Drizzle table definitions, no logic
      //   - routeTree.gen.ts: generated by tsr
      //   - __tests__: test infrastructure (factories, harness) isn't product code
      //   - I18nProvider: context glue, deliberately untested (epic #95 decision)
      //   - router.tsx: router factory, only ever executed by the Start entry
      //   - lib/og/render.ts: the .wasm imports resolve in the worker build
      //     only, so the module cannot load under vitest at all (see the file)
      //   - routes/design-system.tsx: noindex living-styleguide page, in no nav
      // Everything else stays IN, `src/routes/**` included: the server-handler
      // routes are reachable through `Route.options.server.handlers` with a real
      // Request (see __tests__/server/mcp/route.test.ts), and a UI route's
      // validateSearch/head/loader are plain functions on `Route.options`.
      exclude: [
        ...coverageConfigDefaults.exclude,
        // Declaration files carry no executable code, and the explicit `include`
        // above matches them past the defaults.
        "src/**/*.d.ts",
        "src/components/ui/**",
        "src/db/schema/**",
        "src/routeTree.gen.ts",
        "src/__tests__/**",
        "src/i18n/I18nProvider.tsx",
        "src/router.tsx",
        // start.ts: same shape as router.tsx — a Start entry the framework
        // resolves and runs, never importable on its own here. Every piece of
        // judgement it makes lives in a pure lib module precisely so it can be
        // tested without a Worker: what may be cached and under what key in
        // lib/http-cache.ts, which URLs have a markdown twin in lib/md-path.ts.
        // Keep it that way — code added to the middlewares themselves is code
        // this exclusion hides.
        "src/start.ts",
        "src/lib/og/render.ts",
        "src/routes/design-system.tsx",
        "src/**/index.ts",
      ],
    },
  },
});
