#!/usr/bin/env bash
#
# migrate-r2-objects.sh — copy every R2 object recorded in the `uploads` table
# from the old bucket to the new one, preserving keys AND content types. Uses
# only the Cloudflare API token (wrangler r2) — no S3 access keys needed.
#
# Keys are preserved, so once assets.laigary.com is repointed to the new bucket
# at cutover, every existing image URL keeps working with no content rewriting.
#
# Missing keys (upload rows whose object is gone from the bucket — already-broken
# references the live site can't serve either) are skipped and counted; any other
# error (auth, network) aborts. If the summary shows *everything* skipped, the
# uploads table isn't mirroring the bucket — use the rclone path in
# docs/data-migration.md instead (enumerates the real bucket via the S3 API).
#
# Prereqs:
#   - Run AFTER migrate-d1-data.sh (reads the uploads table from laigary-db).
#   - Authenticated wrangler + jq.
#
# Usage: bash scripts/migrate-r2-objects.sh
set -euo pipefail

OLD_BUCKET="laigary-blog-assets"
NEW_BUCKET="laigary-assets"
DB="laigary-db"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

rows=$(npx wrangler d1 execute "$DB" --remote -y --json \
  --command "SELECT r2_key, content_type FROM uploads;" | jq -c '.[0].results[]')

if [ -z "$rows" ]; then
  echo "==> No uploads recorded — nothing to copy."
  exit 0
fi

copied=0
skipped=0
while IFS= read -r row; do
  key=$(echo "$row" | jq -r '.r2_key')
  ct=$(echo "$row" | jq -r '.content_type')
  if err=$(npx wrangler r2 object get "${OLD_BUCKET}/${key}" --remote --file "$TMP/obj" 2>&1); then
    npx wrangler r2 object put "${NEW_BUCKET}/${key}" --remote --file "$TMP/obj" --content-type "$ct" >/dev/null
    echo "  copied  ${key}"
    copied=$((copied + 1))
  elif echo "$err" | grep -qiE "does not exist|not found"; then
    echo "  SKIP (missing in ${OLD_BUCKET})  ${key}"
    skipped=$((skipped + 1))
  else
    echo "$err"
    echo "==> Aborting: unexpected error on ${key} (not a missing-key error)."
    exit 1
  fi
done <<< "$rows"

echo "==> Done. copied=${copied} skipped=${skipped} (of $((copied + skipped)) upload rows)."
if [ "$copied" -eq 0 ]; then
  echo "==> Nothing copied — the uploads table likely doesn't mirror the bucket."
  echo "    Use the rclone path in docs/data-migration.md."
  exit 1
fi
