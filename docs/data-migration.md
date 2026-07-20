# Data migration (#10)

Copy the live site's data from the **old** Cloudflare resources to the **new**
ones provisioned by Alchemy (#9):

|     | Old (laigary.com-next) | New (this repo)  |
| --- | ---------------------- | ---------------- |
| D1  | `laigary-blog`         | `laigary-db`     |
| R2  | `laigary-blog-assets`  | `laigary-assets` |

The new D1 already has the full schema (Alchemy applied `migrations/*.sql` on
deploy), so this is **data-only**. Both scripts are **re-runnable** — run them
once now to validate, then again at cutover for a fresh snapshot.

> ⚠️ These scripts hit **production data** and need Cloudflare credentials. Run
> them yourself; they are not part of CI. Nothing here rewrites content — keys
> and IDs are preserved.

## Prerequisites

- Authenticated wrangler: `export CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=…`
  (or `npx wrangler login`). The token needs D1 + R2 read on the old resources
  and write on the new ones.
- `jq` installed.

## 1. D1 data

```bash
pnpm migrate:d1     # → scripts/migrate-d1-data.sh
```

What it does:

1. Exports each table from `laigary-blog` **data-only**, in FK-parent-first
   order (parents → junctions/children), so imports never violate a foreign key.
2. Clears `laigary-db` data (reverse FK order) so re-runs are idempotent.
3. Imports parents → children.
4. Prints old-vs-new **row counts per table** and fails on any mismatch.

IDs are TEXT UUIDs and are preserved, so foreign keys and the `r2_key`
references in content stay valid.

## 2. R2 objects

```bash
pnpm migrate:r2     # → scripts/migrate-r2-objects.sh   (run AFTER step 1)
```

Reads `r2_key` + `content_type` from the migrated `uploads` table and copies
each object from `laigary-blog-assets` → `laigary-assets` (keys + content types
preserved), using only the API token. Rows whose object is missing from the old
bucket are skipped and counted (already-broken references); the summary prints
`copied` / `skipped`.

**If everything is skipped** (or the bucket holds objects not in `uploads`), the
table isn't a faithful mirror — copy the real bucket contents with `rclone`:

```bash
# One-time: configure two R2 S3 remotes (needs R2 S3 access keys — from the old
# project's R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY, or mint an R2 API token).
rclone config   # add remotes `r2old` and `r2new` (provider Cloudflare R2, S3 endpoint)
rclone copy r2old:laigary-blog-assets r2new:laigary-assets --progress
```

## 3. Verify

- [ ] D1 row counts match (the script asserts this).
- [ ] Spot-check a post's `content_md` / `cover_image_url` in the new DB.
- [ ] R2 object count matches `SELECT COUNT(*) FROM uploads`.
- [ ] Images load from the new bucket (once its public domain is reachable).

## Cutover note (later phase)

`assets.laigary.com` still points at the **old** bucket. Because keys are
preserved, repointing it to `laigary-assets` at cutover makes every existing
`https://assets.laigary.com/<key>` URL resolve from the new bucket with **zero
content rewriting**. Domain repoint + `laigary.com` custom domain happen at
final cutover, not here.
