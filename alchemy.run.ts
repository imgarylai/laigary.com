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
  // Encryption password for `alchemy.secret()` values (the R2 presign creds
  // bound to the worker, added in #41). Without it, Alchemy can't serialize the
  // secrets into state and every deploy dies with "Cannot serialize secret
  // without password". Reuse ALCHEMY_STATE_TOKEN — it's a strong secret already
  // present in every real deploy context (CI forwards it), so no extra secret is
  // needed. (Local deploys touching the R2 secrets need it set locally too.)
  password: process.env.ALCHEMY_STATE_TOKEN,
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
    // Non-secret vars.
    R2_PUBLIC_URL: "https://assets.laigary.com",
    R2_S3_ENDPOINT: "https://d71f0bf817919431312c711f0543a272.r2.cloudflarestorage.com",
    R2_BUCKET_NAME: "laigary-assets",
    // R2 S3 presign credentials (used by the admin upload flow, #28). Supplied
    // at deploy time via env (the deploy workflow forwards the GitHub secrets);
    // alchemy.secret encrypts them into the worker rather than storing plaintext.
    // Guarded so a deploy before the secrets are configured still succeeds
    // (uploads activate on the next deploy once the secrets exist) instead of
    // hard-failing on alchemy.secret(undefined).
    ...(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
      ? {
          R2_ACCESS_KEY_ID: alchemy.secret(process.env.R2_ACCESS_KEY_ID),
          R2_SECRET_ACCESS_KEY: alchemy.secret(process.env.R2_SECRET_ACCESS_KEY),
        }
      : {}),
    // Bearer token gating the MCP write tools (/mcp endpoint). Guarded the
    // same way: without the secret the deploy still succeeds and the MCP
    // server runs read-only.
    ...(process.env.MCP_ADMIN_TOKEN
      ? { MCP_ADMIN_TOKEN: alchemy.secret(process.env.MCP_ADMIN_TOKEN) }
      : {}),
  },
});

// Protect ONLY the /admin path with Cloudflare Access (self-hosted app). The
// path in `domain` scopes it to /admin — the public site stays open. Login uses
// the account's existing IdP (Google OAuth); `allowedIdps` is left unset so all
// account IdPs are accepted. Only the owner's email is allowed in.
//
// `adopt: true` takes over the existing Access app/policy (matched by `name`)
// instead of failing on a duplicate — so this re-adopts the live "laigary admin"
// app / "Allow owner" policy rather than recreating them.
//
// The logical IDs were briefly suffixed `-v2` to abandon stale Alchemy state
// (state held a dead policy/app ID → the update path did `PUT /{dead-id}` → 404,
// with no create fallback). Now renamed back to the clean IDs: the previous
// deploy persisted `delete: false` on the `-v2` resources, so as those become
// orphans here their delete handlers skip the Cloudflare deletion (they only drop
// the stale state entry) instead of tearing down the app/policy these clean IDs
// re-adopt by name. `delete: false` stays on as teardown protection for the
// /admin auth gate. Physical names are unchanged throughout.
export const adminAccess = await AccessApplication("laigary-admin", {
  name: "laigary admin",
  type: "self_hosted",
  domain: "laigary.com/admin",
  adopt: true,
  delete: false,
  policies: [
    await AccessPolicy("laigary-admin-allow", {
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
