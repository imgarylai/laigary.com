// Ambient types for the Workers runtime bits that neither `vite/client` nor the
// DOM lib knows about.
//
// This file must stay free of top-level `import`/`export`. A top-level import
// makes it a module, and `declare module "…"` inside a module is an
// *augmentation* of an existing module rather than a declaration of a new one —
// which is why `cloudflare:workers` kept failing to resolve (TS2307) even though
// this file appeared to declare it. A type-only `import(...)` inside the block
// keeps the file a global script.

declare module "cloudflare:workers" {
  // The worker's Alchemy bindings (DB, R2_ASSETS, R2_* vars), so queries and
  // uploads get typed binding access.
  type WorkerEnv = (typeof import("../alchemy.run.ts"))["worker"]["Env"];

  export const env: WorkerEnv;

  namespace Cloudflare {
    export interface Env extends WorkerEnv {}
  }
}

// `caches.default` is the Workers-only default cache (src/server/og.ts). The DOM
// lib's CacheStorage declares open/match/… but no `default`, so merge it in.
interface CacheStorage {
  readonly default: Cache;
}
