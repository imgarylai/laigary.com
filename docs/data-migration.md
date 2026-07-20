# Data migration (#10)

Copy the live site's data from the **old** D1 (`laigary-blog`) into the **new**
D1 (`laigary-db`) provisioned by Alchemy (#9). The new D1 already has the full
schema (Alchemy applied `migrations/*.sql` on deploy), so this is **data-only**,
and the script is **re-runnable** — run it once now to validate, then again at
cutover for a fresh snapshot.

> ⚠️ This hits **production data** and needs Cloudflare credentials. Run it
> yourself; it is not part of CI. Nothing here rewrites content — keys and IDs
> are preserved.

## Prerequisites

- Authenticated wrangler: `export CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…`
  (or `npx wrangler login`). The token needs D1 read on `laigary-blog` and
  D1 write on `laigary-db`.
- `jq` installed.

## D1 data

```bash
pnpm migrate:d1     # → scripts/migrate-d1-data.sh
```

What it does:

1. Exports each table from `laigary-blog` **data-only**, in FK-parent-first
   order (parents → junctions/children), so imports never violate a foreign key.
2. Clears `laigary-db` data (reverse FK order) so re-runs are idempotent.
3. Imports parents → children.
4. Prints old-vs-new **row counts per table** and fails on any mismatch.

IDs are TEXT UUIDs and are preserved, so foreign keys stay valid.

## R2 objects — nothing to migrate

The old `laigary-blog-assets` bucket has no content worth migrating (and the R2
S3 keys are no longer available). `laigary-assets` starts empty; the admin
upload flow (#8) populates it going forward.

If any migrated `uploads` rows / post `cover_image_url` values reference old
objects that don't exist, they'll simply 404 — clean those rows up if they
surface. If a bulk copy is ever needed, use `rclone` between two R2 S3 remotes.

## Verify

- [ ] D1 row counts match (the script asserts this).
- [ ] Spot-check a post's `content_md` in the new DB.

## Cutover note (later phase)

`assets.laigary.com` still points at the old bucket. At final cutover it is
repointed to `laigary-assets` (along with the `laigary.com` custom domain) —
not here.
