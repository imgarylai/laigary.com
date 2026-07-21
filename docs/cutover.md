# Cutover runbook (#12 — Phase 9)

Staging verification → DNS cutover → decommission. Most steps here are **manual
Cloudflare / DNS operations** — this doc is the checklist to run them against.

## How the cutover actually works

The cutover is codified in `alchemy.run.ts`, not done by hand:

- CI deploys on every push to `main` via `pnpm exec alchemy deploy --stage prod`
  (`.github/workflows/ci.yml`, the `deploy` job, after `check` passes).
- The worker binds the apex with
  `domains: [{ domainName: "laigary.com", adopt: true, overrideExistingOrigin: true }]`.
  `adopt` takes over the existing custom-domain binding; `overrideExistingOrigin`
  transfers it off the old worker. **The first prod deploy is the domain
  cutover**; every deploy after is idempotent.
- D1 migrations (`migrations/*.sql`) are applied on deploy via Alchemy's
  `migrationsDir`. R2 (`laigary-assets`) and Cloudflare Access (`/admin`) are IaC too.

So the apex is served by the new TanStack Start worker as soon as a prod deploy
has run. `url: true` keeps the `*.workers.dev` URL for staging tests.

## 1. Staging verification (before trusting the cutover)

Hit the `*.workers.dev` URL (or `next.laigary.com` if pointed) and smoke-test:

- [ ] Home `/`, `/posts`, a post `/posts/<slug>`, `/tags`, `/tags?tag=…`
- [ ] Interview `/interview`, a section, a note
- [ ] A DB page (`/about`), `/design-system`
- [ ] Admin `/admin` (behind Cloudflare Access — login works, CRUD works)
- [ ] OG images: `/api/og`, `/api/og/posts/<slug>`, `/api/og/interview/<sect>/<slug>`
- [ ] `/sitemap.xml`, `/feed.xml`, `/robots.txt`
- [ ] Images load from `assets.laigary.com`
- [ ] Theme (system/light/dark) + locale (zh-TW/en, no first-paint flash)
- [ ] Lighthouse vs the old site (perf/SEO/a11y not regressed)

## 2. Cutover

- [ ] Lower the DNS TTL on `laigary.com` ahead of time (fast rollback).
- [ ] Confirm the apex is served by `laigary-web` (a prod deploy has run). If not,
      merge to `main` (or run `pnpm exec alchemy deploy --stage prod`).
- [ ] Confirm `assets.laigary.com` points at the new R2 bucket (see #10).
- [ ] Immediately re-run the smoke test above against `https://laigary.com`.

## 3. Rollback path

- [ ] Keep the **old `laigary.com-next` worker** deployed and reachable so the
      apex can be pointed back to it if needed.
- [ ] Fastest rollback: repoint the `laigary.com` custom domain to the old worker
      in the Cloudflare dashboard (low TTL makes this quick).

## 4. Decommission / backup retention (收尾)

- [ ] Observe for ~1–2 weeks.
- [ ] Then decommission the old `laigary.com-next` worker.
- [ ] **Keep the old D1 / R2 as backup** for a while after that; verify the new
      data is correct and complete before deleting anything.

## Acceptance

- `laigary.com` is served by the new TanStack Start worker.
- A clear rollback path and a backup-retention window exist.
