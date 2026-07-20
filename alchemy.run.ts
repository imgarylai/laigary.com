/// <reference types="node" />
import alchemy from "alchemy";
import {
  AccessApplication,
  AccessPolicy,
  D1Database,
  R2Bucket,
  TanStackStart,
} from "alchemy/cloudflare";
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
// worker. Data was copied from the live site in #10.
const db = await D1Database("laigary-db", {
  name: "laigary-db",
  migrationsDir: "./migrations",
});

// R2 bucket for uploads.
const assets = await R2Bucket("laigary-assets", {
  name: "laigary-assets",
});

// The TanStack Start worker.
//   - `domains` binds the live apex `laigary.com` to this worker.
//     `adopt: true` takes control of the existing custom-domain binding in the
//     zone (the apex already has one from the old worker), and
//     `overrideExistingOrigin` forcibly transfers it off that worker — i.e. this
//     deploy is the domain cutover. The public frontend is still the scaffold
//     placeholder until #6.
//   - `url: true` also keeps the *.workers.dev URL for testing.
export const worker = await TanStackStart("laigary-web", {
  name: "laigary-web",
  build: "vite build",
  url: true,
  domains: [{ domainName: "laigary.com", adopt: true, overrideExistingOrigin: true }],
  bindings: {
    DB: db,
    R2_ASSETS: assets,
    // Non-secret vars. R2 presign secrets (R2_ACCESS_KEY_ID/SECRET) are added
    // with the admin upload flow (#28).
    R2_PUBLIC_URL: "https://assets.laigary.com",
    R2_S3_ENDPOINT: "https://d71f0bf817919431312c711f0543a272.r2.cloudflarestorage.com",
    R2_BUCKET_NAME: "laigary-assets",
  },
});

// Protect ONLY the /admin path with Cloudflare Access (self-hosted app). The
// path in `domain` scopes it to /admin — the public site stays open. Login uses
// the account's existing IdP (Google OAuth); `allowedIdps` is left unset so all
// account IdPs are accepted. Only the owner's email is allowed in.
//
// `adopt: true` takes over the existing Access app/policy (laigary.com/admin was
// already gated by a Cloudflare Access app from the old site) instead of failing
// on a duplicate — adoption matches by `name`, so the live app must be named
// "laigary admin" (rename it in Zero Trust, or delete it and let this recreate).
// Requires the deploy token to carry Access: Apps and Policies (Edit).
//
// The logical IDs carry an `-v2` suffix to abandon stale Alchemy state from an
// earlier partial run: state held a policy/app ID that Cloudflare no longer has,
// so the update path did `PUT /{dead-id}` → 404 (that path has no create
// fallback). A fresh logical ID forces the create path — which adopts by name if
// the resource still exists, or creates it otherwise. Physical names are
// unchanged.
//
// `delete: false` step 1 of renaming the `-v2` logical IDs back to clean names:
// it persists "don't tear down" into state so that when the `-v2` IDs later
// become orphans (removed from the program by the rename), their delete handlers
// skip the Cloudflare deletion — otherwise the orphan cleanup would delete the
// very app/policy the renamed-back resource re-adopts (same physical name). It
// also doubles as teardown protection for the /admin auth gate.
export const adminAccess = await AccessApplication("laigary-admin-v2", {
  name: "laigary admin",
  type: "self_hosted",
  domain: "laigary.com/admin",
  adopt: true,
  delete: false,
  policies: [
    await AccessPolicy("laigary-admin-allow-v2", {
      name: "Allow owner",
      decision: "allow",
      adopt: true,
      delete: false,
      include: [{ email: { email: "garylai1990@gmail.com" } }],
    }),
  ],
});

console.log(`🚀 Deployed: ${worker.url} (laigary.com)`);

await app.finalize();
