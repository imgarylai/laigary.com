/// <reference types="node" />
import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

// Alchemy state:
//   - CI: persist state in Cloudflare (a DO-backed state worker) so repeat runs
//     are idempotent. Alchemy refuses to use local state in CI to avoid orphaned
//     infra. CloudflareStateStore reads its token from ALCHEMY_STATE_TOKEN — the
//     deploy workflow reuses CLOUDFLARE_API_TOKEN for it, so no extra secret.
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
  command: "vite build",
  url: true,
});

console.log(`🚀 Deployed: ${worker.url}`);

await app.finalize();
