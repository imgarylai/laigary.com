#!/usr/bin/env bash
#
# migrate-r2-objects.sh — copy every R2 object recorded in the `uploads` table
# from the old bucket to the new one, preserving keys AND content types. Uses
# only the Cloudflare API token (wrangler r2) — no S3 access keys needed.
#
# Keys are preserved, so once assets.laigary.com is repointed to the new bucket
# at cutover, every existing image URL keeps working with no content rewriting.
#
# Prereqs:
#   - Run AFTER migrate-d1-data.sh (reads the uploads table from laigary-db).
#   - Authenticated wrangler + jq.
#
# NOTE: this copies objects tracked in `uploads`. If any objects were put in the
# bucket outside the admin upload flow, use rclone with two R2 S3 remotes instead.
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

count=0
while IFS= read -r row; do
  key=$(echo "$row" | jq -r '.r2_key')
  ct=$(echo "$row" | jq -r '.content_type')
  echo "  copy ${key} (${ct})"
  npx wrangler r2 object get "${OLD_BUCKET}/${key}" --remote --file "$TMP/obj"
  npx wrangler r2 object put "${NEW_BUCKET}/${key}" --remote --file "$TMP/obj" --content-type "$ct"
  count=$((count + 1))
done <<< "$rows"

echo "==> Copied ${count} object(s) from ${OLD_BUCKET} to ${NEW_BUCKET}."
