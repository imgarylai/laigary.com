import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { TmNotFound } from "@/features/terminal";

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    // Preloading on intent means a loader runs every time the pointer crosses a
    // link. At 0 nothing preloaded was ever reused, so sweeping the admin
    // sidebar re-queried D1 on every pass — the notes list alone ran its loader
    // 14k times in 12 hours, which was 87% of the database's read volume.
    //
    // This is not the usual staleness trade: every mutation form calls
    // `router.invalidate()`, so a save still drops the cache and the next read
    // hits D1. The window only covers navigation between writes.
    defaultPreloadStaleTime: 30_000,
    defaultNotFoundComponent: TmNotFound,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
