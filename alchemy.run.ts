/// <reference types="node" />
import alchemy from "alchemy";
import { D1Database, R2Bucket, TanStackStart } from "alchemy/cloudflare";
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

// D1 database. `migrationsDir` makes Alchemy apply migrations/*.sql on deploy
// (tracked in the d1_migrations table), so the schema is provisioned with the
// worker. Data is copied from the live site in #10.
const db = await D1Database("laigary-db", {
  name: "laigary-db",
  migrationsDir: "./migrations",
});

// R2 bucket for uploads. Custom domain (assets.laigary.com) is attached at
// cutover in a later phase; for now the bucket exists and is bound.
const assets = await R2Bucket("laigary-assets", {
  name: "laigary-assets",
});

// The TanStack Start worker. `url: true` exposes a *.workers.dev URL only —
// no custom domain is attached, so the live laigary.com site is untouched.
// R2 presign secrets (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) are added with
// the admin upload flow (#8); the custom domain + Access come at cutover.
export const worker = await TanStackStart("laigary-web", {
  name: "laigary-web",
  build: "vite build",
  url: true,
  bindings: {
    DB: db,
    R2_ASSETS: assets,
    // Non-secret vars (public URL functional once the custom domain is attached).
    R2_PUBLIC_URL: "https://assets.laigary.com",
    R2_S3_ENDPOINT: "https://d71f0bf817919431312c711f0543a272.r2.cloudflarestorage.com",
    R2_BUCKET_NAME: "laigary-assets",
  },
});

console.log(`🚀 Deployed: ${worker.url}`);

await app.finalize();
