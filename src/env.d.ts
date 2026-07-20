import type { worker } from "../alchemy.run.ts";

// Type the `env` from `cloudflare:workers` with the worker's Alchemy bindings
// (DB, R2_ASSETS, R2_* vars), so queries and uploads get typed binding access.
type WorkerEnv = typeof worker.Env;

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends WorkerEnv {}
  }
}
