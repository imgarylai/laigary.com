// Router harness for testing route *components*.
//
// A route's validateSearch/head/loader are plain functions reachable off
// `Route.options`, but its `component` is not: it calls Route.useLoaderData(),
// Route.useSearch() and useNavigate(), all of which resolve against a live
// router match. So the component can only run inside a real router.
//
// This builds one over the GENERATED route tree rather than a synthetic tree:
// the hooks look their match up by route id, and only the generated tree has
// the real ids. It also means a render exercises __root and the pathless
// layout on the way down, which is the shape the app actually runs in.
//
// Each test file still declares its own mocks — vi.mock factories are hoisted
// per file and cannot be installed from here. Every file using this needs:
//
//   vi.mock("@/lib/og/render", () => ({ renderOgPng: vi.fn() }));
//   vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
//   vi.mock("@tanstack/react-router-devtools", () => ({
//     TanStackRouterDevtoolsPanel: () => null,
//   }));
//   vi.mock("@/i18n/I18nProvider", () => ({
//     I18nProvider: ({ children }: { children: React.ReactNode }) => children,
//     useI18n: () => ({ t: (k: string) => k, locale: "en" }),
//   }));
//   vi.mock("@/server/locale", () => ({ resolveLocaleFn: async () => "en" }));
//
// None are optional:
//   - og/render: the generated tree imports every route eagerly, including
//     /api/og*, whose satori/resvg `.wasm` imports resolve only in the worker
//     build and otherwise fail the run before anything renders.
//   - devtools: __root mounts them outside PROD, and unmounting one during
//     cleanup throws "Devtools is not mounted", failing the test after it
//     otherwise passed.
//   - I18nProvider: __root wraps the tree in it, so the module has to keep
//     exporting a provider; `t` returns the key so assertions do not pin copy.
//   - locale: __root's loader is a server function with no server to call.
import { render } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { vi } from "vitest";
import { allowConsole } from "./console-guard";

/**
 * Stub the browser APIs jsdom lacks that the site shell reaches for on mount:
 * next-themes reads `matchMedia`, cmdk observes element size and scrolls its
 * active row into view, and the archive's pager scrolls the window. Call at
 * module level, before any render.
 */
export function installShellStubs(): void {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
  Element.prototype.scrollIntoView = () => {};
  window.scrollTo = () => {};
}

/**
 * Pull the generated tree in once before the tests run. It reaches every route
 * module and their transitive imports, which costs seconds under coverage
 * instrumentation — enough to blow the default 5s test timeout if the first
 * `renderRoute` pays for it. Call from `beforeAll` with a generous hook
 * timeout so the cost is charged where it belongs and the tests stay honest
 * about their own speed.
 */
export async function warmRouteTree(): Promise<void> {
  await import("@/routeTree.gen");
}

/**
 * Mount the app at `path` and return the router alongside the render result.
 * The caller awaits whatever the route renders (`findByText`) rather than the
 * router's load, so a failing loader surfaces as a missing element rather than
 * a silent pass.
 *
 * __root's shell component IS `<html>`, so mounting it inside Testing
 * Library's container `<div>` makes React log "In HTML, <html> cannot be a
 * child of <div>" once per render — which the console guard would otherwise
 * fail the test over. Rendering into `document` instead is the nesting the app
 * really runs in and silences it, but Testing Library's `cleanup` cannot detach
 * a container it does not own, so every render after the first comes up with an
 * empty `<body>`. The container stays a div and this one message is declared as
 * the harness artifact it is — spelled out in full, so a genuine nesting bug in
 * a route still fails.
 */
export async function renderRoute(path: string) {
  allowConsole(/In HTML, <html> cannot be a child of <div>/);
  const { routeTree } = await import("@/routeTree.gen");
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const result = render(<RouterProvider router={router as never} />);
  return { router, ...result };
}
