/// <reference types="node" />
import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

// Alchemy state:
//   - CI: persist state in Cloudflare so repeat runs are idempotent (Alchemy
//     refuses to use local state in CI to avoid orphaned infra). This uses the
//     account-wide default `alchemy-state-service` worker, SHARED across every
//     Alchemy project on the account — state is namespaced internally by app +
//     stage, so projects never collide. All projects must therefore present the
//     SAME token, supplied via the ALCHEMY_STATE_TOKEN secret. (No per-project
//     state worker; one worker, one token for the whole account.)
//   - Local: default file-system state store (.alchemy/).
const app = await alchemy("laigary", {
  stateStore: process.env.CI ? (scope) => new CloudflareStateStore(scope) : undefined,
});

// The TanStack Start worker. `url: true` exposes a *.workers.dev URL only —
// no custom domain is attached, so the live laigary.com site is untouched.
// All resources share the `laigary-*` prefix (worker here; D1 / R2 / Access
// bindings are added with the same convention in later phases — #9).
export const worker = await TanStackStart("laigary-web", {
  name: "laigary-web",
  build: "vite build",
  url: true,
});

console.log(`🚀 Deployed: ${worker.url}`);

await app.finalize();
