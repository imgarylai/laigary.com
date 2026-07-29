# Project guide for agents

TanStack Start (SSR) blog on Cloudflare Workers. Live at laigary.com — the
production D1 holds real content; never mutate remote data without the owner's
explicit approval (local D1 via `wrangler d1 ... --local` is fair game).

## Commands

```bash
pnpm dev              # vite dev on :3000 (miniflare provides local D1 binding)
pnpm test             # vitest; pnpm lint (oxlint); pnpm format:check (oxfmt)
pnpm build            # vite build (client + workers bundle)
pnpm generate-routes  # tsr generate — run after adding/renaming route files
pnpm typecheck        # tsc --noEmit; gated by CI's Typecheck leg and currently
                      # clean — a new error fails the build, so run it yourself
```

Local D1 schema: `npx wrangler d1 migrations apply laigary-db --local`.

Schema changes: edit `src/db/schema/*` then `pnpm exec drizzle-kit generate
--name <change>` — never hand-write schema migrations (migrations before the
`_baseline` file predate the drizzle-kit snapshot in `migrations/meta/` and
are hand-written history; the baseline itself is a deliberate no-op). Data
backfills go inside the generated file or via `drizzle-kit generate --custom`.

## Workflow

- Branch from `main` (`feat/…`, `fix/…`, `chore/…`); never commit to `main`.
- Conventional Commits enforced by commitlint — subject lowercase, imperative,
  ≤72 chars. PRs rebase-merge; CI (Lint/Format/Test/Build) gates the deploy.
- Merging to `main` auto-deploys to production via Alchemy. The deploy job only
  runs on the `main` ref; `workflow_dispatch` on another branch runs checks
  only (safe way to re-trigger CI when GitHub drops a `pull_request` event).
- lint-staged quirk: a commit whose only staged file is `src/routeTree.gen.ts`
  fails the pre-commit hook (oxlint "no files to lint") — use `--no-verify`.

## Architecture pointers

- Routes: `src/routes/` — `_site/` (public blog, pathless layout), `interview/`
  (sub-site with its own layout), `admin/` (CMS, Cloudflare Access-protected in
  prod only), `api/` (OG image server routes). Server routes use
  `createFileRoute` with `server.handlers`; there is no `createServerFileRoute`.
- Data flow: route `loader` → `createServerFn` (`src/server/public.ts`, admin
  mutations in `src/server/admin/`) → query layer (`src/db/queries/`, Drizzle on
  `env.DB` from `cloudflare:workers`).
- Posts and interview notes are near-equivalent content types — same
  title/slug/status/tags/markdown model, same editor (Tiptap), same admin CRUD
  shape. They differ mainly in where they live: posts are standalone at
  `/posts/<slug>` (editor `PostForm`, `src/server/admin/posts.ts`), notes are
  grouped under a section at `/interview/<section>/<slug>` (editor `NoteForm`,
  `src/server/admin/interview.ts`; a note also carries its `sectionId`). When
  you add or change a feature on one (an admin action, a form field, a list
  column), mirror it on the other unless there's a reason not to.
- Caching, two layers, both keyed off ONE call: every content mutation ends
  with `await revalidateContent()` (`src/db/queries/_revalidate.ts`). Miss it
  in a new mutation and the write is invisible for up to a day.
  1. `src/db/queries/_cache.ts` — an isolate-local read-through cache for the
     three queries every request re-ran: `getSiteSettings` (read twice a page,
     by the layout shell and by `pageChrome`) and the two tag aggregates, which
     SQLite answers by scanning the content table and walking the junction. No
     index fixes those — `status = 'published'` matches nearly every row — so
     not recomputing them per request is the only lever. 60s TTL bounds how
     stale another isolate can get.
  2. `src/start.ts` — a request middleware storing public documents in
     `caches.default`. Cloudflare does not cache a Worker's own responses on
     `Cache-Control` alone. The policy (what may be cached, and the key —
     resolved locale plus content version) is in `src/lib/http-cache.ts`, pure
     and tested there because the middleware itself only runs inside a Worker.
     `curl -I` a page twice; the second should say `x-edge-cache: HIT`.

  Public list pages paginate SERVER-side (`sectionDataImpl`, page size in
  `SECTION_PAGE_SIZE`). Do not reintroduce a `limit: 500` and slice in the
  browser — that is what made the section listing the site's costliest query.

- MCP endpoint (`/mcp`, `src/server/mcp/` + `src/routes/mcp.ts`): stateless
  Streamable HTTP JSON-RPC for AI clients. Read tools are public; write tools
  need `Authorization: Bearer <MCP_ADMIN_TOKEN>` (wrangler secret; unset =
  read-only). New tools go in `src/server/mcp/tools.ts` with a zod validator +
  JSON Schema pair.
- Markdown rendering (`src/lib/markdown.ts`): unified with remark-math → temml
  (MathML, no KaTeX client JS) and rehype-highlight (auto-detect within a
  language subset; ```text marks blocks that must stay uncolored — the corpus
  convention for example output / ASCII diagrams).
- Editor: Tiptap 3 with the OFFICIAL `@tiptap/markdown` bridge. Custom nodes
  need a markdown mapping (`markdownTokenName` / `parseMarkdown` /
  `renderMarkdown` — see `editor/inline-math.ts`) or they serialize as raw HTML
  and pollute stored content.
- OG images (`src/lib/og/`, `src/routes/api/og*`): satori **standalone** entry +
  `init(yoga.wasm)` — the main satori entry runtime-compiles wasm, which workerd
  forbids. Fonts: JetBrains Mono TTFs from `public/fonts/`; CJK glyphs fetched
  per request from Google Fonts css2 with a Safari 5 UA (forces TTF).
- Styling: Tailwind 4 + `src/styles/terminal.css` (`--tm-*` vars, hljs theme).
  Tailwind Typography's decorative `code::before/after` backticks are disabled
  globally in `styles.css` — don't re-enable them.
- i18n: every user-facing string goes through `t()`; add keys to BOTH
  `src/i18n/locales/en.json` and `zh-TW.json`. Enforced by
  `__tests__/i18n/locale-parity.test.ts` — key sets, leaf types and `{placeholder}`
  names must match, and the failure names the offending keys. `getTranslation`
  has no `en` fallback, so a key present in only one file renders as its raw
  dotted path to the reader, not as English.

## Testing conventions

- Tests live in `src/__tests__/`, named `should <behavior> when <condition>`.
- Default vitest environment is node; component tests opt into jsdom with a
  `// @vitest-environment jsdom` first-line directive.
- Query-layer tests run against a real better-sqlite3 DB: call `setupTestDb()`
  from `helpers/test-db` at file top level — it redirects `drizzle-orm/d1` at
  the in-memory DB and wires truncate/close. `cloudflare:workers` is stubbed
  via vitest alias. Mock server functions in component tests — no network, no
  real D1.
- The harness and D1 diverge on transactions, and the harness papers over it.
  D1 has no interactive transactions (`db.transaction()` throws there), so any
  mutation touching more than one table must batch its writes through
  `runBatch` in `db/queries/_db.ts` — its atomic unit is `db.batch()`, which
  D1 runs as one transaction. drizzle's better-sqlite3 driver is the mirror
  image: it has `transaction()` but no `batch()` at all, so `createTestDb()`
  attaches an equivalent that wraps the statements in BEGIN/COMMIT. Without
  that, the harness would run batched writes as separate autocommits and every
  partial-write test would pass for the wrong reason. When you touch this,
  prove the rollback test fails against the unfixed source first.
- Server functions are tested through their exported `*Impl` functions
  (`server/public/*`, `server/admin/*`), never by calling the `createServerFn`
  wrapper: without the Start vite plugin's compile step the wrapper's server
  handler isn't wired and the return value is lost. New server fns follow the
  same split — logic in an exported Impl, wrapper as the one-line validated
  boundary. Those Impl tests run against `setupTestDb()` too, NOT a wholesale
  `vi.mock("@/db/queries")`: a conflict or a not-found is something the query
  layer produces for real, and with it stubbed the assertions decay into
  restating the call you just configured — which is how posts and notes ended
  up testing opposite branches of the same four verbs without either file
  looking incomplete.
- Seed rows through `src/__tests__/factories.ts` (`seedPost`, `seedTag`,
  `seedSection`, `seedNote`, `seedPage`, `seedUpload`) instead of hand-written
  literals; spell out only the fields the test asserts on.
- Structure per describe block: happy-path setup and test first, then the
  error/throw paths (mock one dependency at a time), then isolated helper-fn
  tests for remaining branches.
- Assertion depth: assert the outcome that matters (status, message, `ok`,
  row count, the computed field) — not deep-equals of whole payloads, unless
  computing that value is the function's job.
- Mock hygiene is global, so do NOT hand-roll it per file. `mockReset` and
  `restoreMocks` are on in vitest.config.ts: `vi.fn(impl)` goes back to its
  factory implementation and every `vi.spyOn` is undone between tests. A local
  `vi.clearAllMocks()` is not equivalent — it clears recorded calls but leaves
  implementations installed, which is how a one-off `mockRejectedValue` leaked
  into the next test in #192. Stub a global with `vi.stubGlobal`/`vi.spyOn`
  rather than replacing a built-in wholesale: `{ ...URL }` copies no own
  enumerable properties off a class, so the replacement loses its constructor,
  and `navigator` has none either.
- Test order is shuffled (files and tests both), so a test that leans on a
  sibling running first fails immediately rather than on some future reorder.
  Every run prints its seed; replay one with `--sequence.seed=<n>`. This means
  a test must never depend on declaration order — including "the guard test
  runs after the test that installs the stub".
- `TZ=UTC` is pinned in vitest.config.ts, so assert one exact date. A regex
  spanning two days (`/^2025年7月(19|20)日$/`) hides a real timezone bug rather
  than pinning the behaviour — `toLocaleDateString` reads the system zone.
- Write the fixture so it VIOLATES the property under test. Input that already
  satisfies it makes the assertion unfailable: a year list seeded newest-first
  cannot tell `.sort().reverse()` from no sorting, and `expect(typeof html)` on
  a renderer cannot tell a class rename from anything else. Prove a new test
  fails against the mutation it is meant to catch before trusting it.
- Transient errors (disk I/O, lost connection, disk full — environmental
  failures the public API cannot produce) are the one sanctioned reason to
  mock inside the real-DB harness: `vi.spyOn(harness.db, …)` with
  `mockImplementationOnce` that throws, then `mockRestore()` — one call fails,
  every other test in the file stays on the real database. Never mock to
  fabricate errors the public API can already produce (NOT NULL, UNIQUE —
  trigger those for real).
- Coverage: `pnpm test:coverage` (v8, lcov → Codecov in CI's Test leg; every
  PR gets a diff-coverage comment). `coverage.include` in vitest.config.ts is
  pinned to `src/**/*.{ts,tsx}` and MUST stay pinned: without it v8 measures
  only the modules a run happened to import, so the denominator moves with the
  import graph and a PR that adds one test drops project coverage on files it
  never opened. That was the Codecov drift. Excluded as not-our-unit-to-test:
  `components/ui/**` (vendored), `db/schema/**` (declarative),
  `routeTree.gen.ts` (generated), `src/__tests__/**` (test infra),
  `i18n/I18nProvider.tsx` (context glue, deliberately untested), `router.tsx`
  (Start entry only), `lib/og/render.ts` (its `.wasm` imports resolve in the
  worker build only, so the module cannot load under vitest at all) and
  `routes/design-system.tsx` (noindex styleguide page). Keep that list and the
  `ignore:` list in codecov.yml in sync.
- Routes are NOT excluded. Server handlers need no harness at all — reach them
  at `Route.options.server.handlers` and feed a real `Request`
  (`__tests__/routes/`, `__tests__/server/mcp/route.test.ts`); a UI route's
  `validateSearch` / `head` / `loader` are likewise plain functions on
  `Route.options`.
- Route _components_ need a router, and `__tests__/helpers/router.tsx` is it:
  `renderRoute("/posts?tag=go")` mounts the app over the GENERATED route tree
  with a memory history. It has to be the generated tree — the component's
  `Route.useLoaderData()` / `useSearch()` resolve by route id, and only the
  generated tree carries the real ids. A render therefore also exercises
  `__root` and the pathless layout on the way down. Read the header comment
  before writing one: five `vi.mock` calls are load-bearing (they cannot live
  in the helper — factories are hoisted per file), and `beforeAll(warmRouteTree,
60_000)` keeps the tree import out of the first test's 5s timeout.
- The two layouts' palette closures ARE covered now
  (`__tests__/routes/layout-palettes.test.tsx`); the note here used to say the
  fake-timer flow deadlocked against the palette's async open. It does — if the
  clock is faked before the dialog mounts. Open the palette on the real clock,
  wait for the shell, and only then fake the clock for the 180ms debounce. Every
  row's `onSelect` is the sole definition of where that row goes, so each is
  asserted against `router.state.location.pathname` after a click.
- The admin route wrappers ARE covered (`__tests__/routes/admin-routes.test.tsx`).
  Two earlier versions of this file excused them: first as "what they render is
  already tested" (false), then as a loader-plus-a-render not worth a router
  (also false — they are where `/admin` declares `noindex`, where the three edit
  routes turn a missing row into `notFound()`, and where `/admin/interview`
  redirects instead of rendering). Loaders and `head` are plain functions off
  `Route.options`; the components go through `renderRoute` like any other.
- `mod+k` under jsdom is CTRL+k, not META+k: react-hotkeys-hook resolves `mod`
  per platform and jsdom's user agent is not an Apple one. A `metaKey` event
  matches nothing, so a toggle test written with it passes for the wrong reason
  in one direction and fails in the other.
- Genuinely not covered, so nobody re-litigates it: `DataTable`'s react-table
  filter callback is unreachable by construction. That is the whole list — the
  dialog cancel buttons and the `PagesListClient` / `SectionsListClient` rows
  used to be on it and were simply untested, cancel included. If you exclude
  something new, say why here in terms that are checkable, and check it first.
- No wall-clock waits around a debounce, in either direction. Install fake
  timers, `await act(() => vi.advanceTimersByTimeAsync(PAST_DEBOUNCE))`, then
  assert with a SYNCHRONOUS `getBy` — `advanceTimersByTimeAsync` flushes the
  pending microtasks, so the search has already settled. See the `typeAndSettle`
  helpers in the link-dialog, command-palette and link-suggestion tests. Never
  mix `findBy`/`waitFor` with fake timers: their polling deadlocks against the
  fake clock. This matters twice over — a real sleep makes the assertion depend
  on runner load, and for a "did NOT fire" assertion two input events inside one
  real debounce window collapse into a single trailing call whether or not the
  gate under test works. It is also what keeps the lcov byte-stable between
  runs: real waits let a varying number of renders land inside the window.
- Hooks ARE tested (jsdom `renderHook` + stubbed rAF/matchMedia — see
  `__tests__/hooks/`); their listener math and cleanup regress like any code.
  Don't chase the last percent: a branch only reachable by mocking what the
  public API can't produce is left uncovered (or, for transient errors, tested
  per the rule above).
- The `createServerFn` wrapper arrows carry
  `/* v8 ignore start -- RPC boundary … */` rather than sitting permanently red.
  Verified, not assumed: calling the fn throws "No Start context found in
  AsyncLocalStorage", and so does its private `__executeServer` — reaching them
  needs both that underscore-prefixed property AND a `Symbol.for(...)` global
  the Start runtime installs, two private contracts of a dependency Renovate
  bumps weekly. Types already catch the realistic slip (a validator's output
  type has to match its Impl's input), and every wrapper is one line over a
  tested Impl. Marking them keeps ~54 permanently unreachable functions out of
  the denominator instead of training everyone to ignore a red number.
- That marker is for the RPC boundary only. Anything else living inside a
  handler should move OUT to an exported `*Impl` instead of being ignored —
  `server/posts.ts` and `server/locale.ts` were both inline, and their paging
  defaults (`limit ?? 100`) and request-key names (`locale`,
  `accept-language`) are real behaviour that fails silently.
- console.error / console.warn FAIL the test that emitted them
  (`__tests__/helpers/console-guard.ts`, installed from `setup.ts`). Vitest 4
  only prints console output for failing tests, so a green run is no evidence of
  a quiet one — the suite was emitting 46 warnings a run and showing none of
  them. No product code writes to those channels, so anything appearing there is
  React, jsdom or a component library reporting a real defect. If a warning IS
  what a test asserts, declare it with `allowConsole(/…/)` and spell the message
  out; do not widen the pattern to shut a class of them up.
- `*.css?url` resolves to `__tests__/stubs/css-url.ts` under vitest
  (`cssUrlStub` in vitest.config.ts). Vite only mints the hashed asset URL in a
  real build, so `styles.css?url` is `""` otherwise and __root renders
  `<link rel="stylesheet" href="">` — an empty `href` React warns about on every
  render. The stub exports `undefined`, NOT a plausible URL: React 19 treats a
  stylesheet link with an href as a suspensey resource and holds the commit
  until it loads, which under jsdom never happens, and every route test then
  renders an empty container.

## TanStack reference (tool-managed)

The block below is generated by TanStack Intent. Before editing TanStack-
related code, run the matching `pnpm dlx @tanstack/intent … load` command to
pull the official guidance for that topic (e.g. `start-core/server-routes`
documents the `server.handlers` route API). Do not hand-edit the block.

<!-- intent-skills:start -->

# TanStack Intent - before editing files, run the matching guidance command.

tanstackIntent:

- id: "@tanstack/devtools#devtools-app-setup"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/devtools#devtools-app-setup"
  for: "Install TanStack Devtools, pick framework adapter (React/Vue/Solid/Preact), register plugins via plugins prop, configure shell (position, hotkeys, theme, hideUntilHover, requireUrlFlag, eventBusConfig). TanStackDevtools component, defaultOpen, localStorage persistence."
- id: "@tanstack/devtools#devtools-marketplace"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/devtools#devtools-marketplace"
  for: "Publish plugin to npm and submit to TanStack Devtools Marketplace. PluginMetadata registry format, plugin-registry.ts, pluginImport (importName, type), requires (packageName, minVersion), framework tagging, multi-framework submissions, featured plugins."
- id: "@tanstack/devtools#devtools-plugin-panel"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/devtools#devtools-plugin-panel"
  for: "Build devtools panel components that display emitted event data. Listen via EventClient.on(), handle theme (light/dark), use @tanstack/devtools-ui components. Plugin registration (name, render, id, defaultOpen), lifecycle (mount, activate, destroy), max 3 active plugins. Two paths: Solid.js core with devtools-ui for multi-framework support, or framework-specific panels."
- id: "@tanstack/devtools#devtools-production"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/devtools#devtools-production"
  for: "Handle devtools in production vs development. removeDevtoolsOnBuild, devDependency vs regular dependency, conditional imports, NoOp plugin variants for tree-shaking, non-Vite production exclusion patterns."
- id: "@tanstack/devtools-event-client#devtools-bidirectional"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-bidirectional"
  for: "Two-way event patterns between devtools panel and application. App-to-devtools observation, devtools-to-app commands, time-travel debugging with snapshots and revert. structuredClone for snapshot safety, distinct event suffixes for observation vs commands, serializable payloads only."
- id: "@tanstack/devtools-event-client#devtools-event-client"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-event-client"
  for: "Create typed EventClient for a library. Define event maps with typed payloads, pluginId auto-prepend namespacing, emit()/on()/onAll()/onAllPluginEvents() API. Connection lifecycle (5 retries, 300ms), event queuing, enabled/disabled state, SSR fallbacks, singleton pattern. Unique pluginId requirement to avoid event collisions."
- id: "@tanstack/devtools-event-client#devtools-instrumentation"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-instrumentation"
  for: "Analyze library codebase for critical architecture and debugging points, add strategic event emissions. Identify middleware boundaries, state transitions, lifecycle hooks. Consolidate events (1 not 15), debounce high-frequency updates, DRY shared payload fields, guard emit() for production. Transparent server/client event bridging."
- id: "@tanstack/devtools-vite#devtools-vite-plugin"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/devtools-vite#devtools-vite-plugin"
  for: "Configure @tanstack/devtools-vite for source inspection (data-tsd-source, inspectHotkey, ignore patterns), console piping (client-to-server, server-to-client, levels), enhanced logging, server event bus (port, host, HTTPS), production stripping (removeDevtoolsOnBuild), editor integration (launch-editor, custom editor.open). Must be FIRST plugin in Vite config. Vite ^6 || ^7 only."
- id: "@tanstack/react-start#lifecycle/migrate-from-nextjs"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/react-start#lifecycle/migrate-from-nextjs"
  for: "Step-by-step migration from Next.js App Router to TanStack Start: route definition conversion, API mapping, server function conversion from Server Actions, middleware conversion, data fetching pattern changes."
- id: "@tanstack/react-start#react-start"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/react-start#react-start"
  for: "React bindings for TanStack Start: createStart, StartClient, StartServer, React-specific imports, re-exports from @tanstack/react-router, full project setup with React, useServerFn hook."
- id: "@tanstack/react-start#react-start/server-components"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/react-start#react-start/server-components"
  for: "Implement, review, debug, and refactor TanStack Start React Server Components in React 19 apps. Use when tasks mention @tanstack/react-start/rsc, renderServerComponent, createCompositeComponent, CompositeComponent, renderToReadableStream, createFromReadableStream, createFromFetch, Composite Components, React Flight streams, loader or query owned RSC caching, router.invalidate, structuralSharing: false, selective SSR, stale names like renderRsc or .validator, or migration from Next App Router RSC patterns. Do not use for generic SSR or non-TanStack RSC frameworks except brief comparison."
- id: "@tanstack/router-core#router-core"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core"
  for: "Framework-agnostic core concepts for TanStack Router: route trees, createRouter, createRoute, createRootRoute, createRootRouteWithContext, addChildren, Register type declaration, route matching, route sorting, file naming conventions. Entry point for all router skills."
- id: "@tanstack/router-core#router-core/auth-and-guards"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/auth-and-guards"
  for: "Route protection with beforeLoad, redirect()/throw redirect(), isRedirect helper, authenticated layout routes (\_authenticated), non-redirect auth (inline login), RBAC with roles and permissions, auth provider integration (Auth0, Clerk, Supabase), router context for auth state."
- id: "@tanstack/router-core#router-core/code-splitting"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/code-splitting"
  for: "Automatic code splitting (autoCodeSplitting), .lazy.tsx convention, createLazyFileRoute, createLazyRoute, lazyRouteComponent, getRouteApi for typed hooks in split files, codeSplitGroupings per-route override, splitBehavior programmatic config, critical vs non-critical properties."
- id: "@tanstack/router-core#router-core/data-loading"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/data-loading"
  for: "Route loader option, loaderDeps for cache keys, staleTime/gcTime/ defaultPreloadStaleTime SWR caching, pendingComponent/pendingMs/ pendingMinMs, errorComponent/onError/onCatch, beforeLoad, router context and createRootRouteWithContext DI pattern, router.invalidate, Await component, deferred data loading with unawaited promises."
- id: "@tanstack/router-core#router-core/navigation"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/navigation"
  for: "Link component, useNavigate, Navigate component, router.navigate, ToOptions/NavigateOptions/LinkOptions, from/to relative navigation, activeOptions/activeProps, preloading (intent/viewport/render), preloadDelay, navigation blocking (useBlocker, Block), createLink, linkOptions helper, scroll restoration, MatchRoute."
- id: "@tanstack/router-core#router-core/not-found-and-errors"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/not-found-and-errors"
  for: "notFound() function, notFoundComponent, defaultNotFoundComponent, notFoundMode (fuzzy/root), errorComponent, CatchBoundary, CatchNotFound, isNotFound, NotFoundRoute (deprecated), route masking (mask option, createRouteMask, unmaskOnReload)."
- id: "@tanstack/router-core#router-core/path-params"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/path-params"
  for: "Dynamic path segments ($paramName), splat routes ($ / \_splat), optional params ({-$paramName}), prefix/suffix patterns ({$param}.ext), useParams, params.parse/stringify, pathParamsAllowedCharacters, i18n locale patterns."
- id: "@tanstack/router-core#router-core/search-params"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/search-params"
  for: "validateSearch, search param validation with Zod/Valibot/ArkType adapters, fallback(), search middlewares (retainSearchParams, stripSearchParams), custom serialization (parseSearch, stringifySearch), search param inheritance, loaderDeps for cache keys, reading and writing search params."
- id: "@tanstack/router-core#router-core/ssr"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/ssr"
  for: "Non-streaming and streaming SSR, RouterClient/RouterServer, renderRouterToString/renderRouterToStream, createRequestHandler, defaultRenderHandler/defaultStreamHandler, HeadContent/Scripts components, head route option (meta/links/styles/scripts), ScriptOnce, automatic loader dehydration/hydration, memory history on server, data serialization, document head management."
- id: "@tanstack/router-core#router-core/type-safety"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/type-safety"
  for: "Full type inference philosophy (never cast, never annotate inferred values), Register module declaration, from narrowing on hooks and Link, strict:false for shared components, getRouteApi for code-split typed access, addChildren with object syntax for TS perf, LinkProps and ValidateLinkOptions type utilities, as const satisfies pattern."
- id: "@tanstack/router-plugin#router-plugin"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/router-plugin#router-plugin"
  for: "TanStack Router bundler plugin for route generation and automatic code splitting. Supports Vite, Webpack, Rspack, and esbuild. Configures autoCodeSplitting, routesDirectory, target framework, and code split groupings."
- id: "@tanstack/start-client-core#start-core"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/start-client-core#start-core"
  for: "Core overview for TanStack Start: tanstackStart() Vite plugin, getRouter() factory, root route document shell (HeadContent, Scripts, Outlet), client/server entry points, routeTree.gen.ts, tsconfig configuration. Entry point for all Start skills."
- id: "@tanstack/start-client-core#start-core/auth-server-primitives"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/start-client-core#start-core/auth-server-primitives"
  for: "Server-side authentication primitives for TanStack Start: session cookies (HttpOnly, Secure, SameSite, \_\_Host- prefix), session read/issue/destroy via createServerFn and middleware, OAuth authorization-code flow with state and PKCE, password-reset enumeration defense, CSRF for non-GET RPCs, rate limiting auth endpoints, session rotation on privilege change. Pairs with router-core/auth-and-guards for the routing side."
- id: "@tanstack/start-client-core#start-core/deployment"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/start-client-core#start-core/deployment"
  for: "Deploy to Cloudflare Workers, Netlify, Vercel, Node.js/Docker, Bun, Railway. Selective SSR (ssr option per route), SPA mode, static prerendering, ISR with Cache-Control headers, SEO and head management."
- id: "@tanstack/start-client-core#start-core/execution-model"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/start-client-core#start-core/execution-model"
  for: "Isomorphic-by-default principle, environment boundary functions (createServerFn, createServerOnlyFn, createClientOnlyFn, createIsomorphicFn), ClientOnly component, useHydrated hook, import protection, dead code elimination, environment variable safety (VITE\_ prefix, process.env)."
- id: "@tanstack/start-client-core#start-core/middleware"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/start-client-core#start-core/middleware"
  for: "createMiddleware, request middleware (.server only), server function middleware (.client + .server), context passing via next({ context }), sendContext for client-server transfer, global middleware via createStart in src/start.ts, middleware factories, method order enforcement, fetch override precedence."
- id: "@tanstack/start-client-core#start-core/server-functions"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-functions"
  for: "createServerFn (GET/POST), validator (Zod or function), useServerFn hook, server context utilities (getRequest, getRequestHeader, setResponseHeader, setResponseStatus), error handling (throw errors, redirect, notFound), streaming, FormData handling, file organization (.functions.ts, .server.ts)."
- id: "@tanstack/start-client-core#start-core/server-routes"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-routes"
  for: "Server-side API endpoints using the server property on createFileRoute, HTTP method handlers (GET, POST, PUT, DELETE), createHandlers for per-handler middleware, handler context (request, params, context), request body parsing, response helpers, file naming for API routes."
- id: "@tanstack/start-server-core#start-server-core"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/start-server-core#start-server-core"
  for: "Server-side runtime for TanStack Start: createStartHandler, request/response utilities (getRequest, setResponseHeader, setCookie, getCookie, useSession), three-phase request handling, AsyncLocalStorage context."
- id: "@tanstack/virtual-file-routes#virtual-file-routes"
  run: "pnpm dlx @tanstack/intent@latest load @tanstack/virtual-file-routes#virtual-file-routes"
  for: "Programmatic route tree building as an alternative to filesystem conventions: rootRoute, index, route, layout, physical, defineVirtualSubtreeConfig. Use with TanStack Router plugin's virtualRouteConfig option."

<!-- intent-skills:end -->
