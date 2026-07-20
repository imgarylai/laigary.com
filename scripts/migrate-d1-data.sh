#!/usr/bin/env bash
#
# migrate-d1-data.sh — copy DATA from the live `laigary-blog` D1 into the new
# `laigary-db` D1. The schema is already applied by Alchemy (#9), so this is
# data-only. Re-runnable (clears the new DB's data first), so it can be run once
# now to validate and again at cutover for a fresh snapshot.
#
# Prereqs:
#   - Authenticated wrangler: export CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID,
#     or run `npx wrangler login`. Token needs D1 read on laigary-blog and
#     D1 write on laigary-db.
#   - jq installed.
#
# Usage: bash scripts/migrate-d1-data.sh
set -euo pipefail

OLD_DB="laigary-blog"
NEW_DB="laigary-db"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

wr() { npx wrangler "$@"; }

# FK-parent-first order. Tables *within* a group have no cross-dependencies, so
# per-group import order is enough to satisfy every foreign key.
GROUP0=(tags posts interview_sections pages site_settings uploads)  # no FKs
GROUP1=(post_tags interview_notes)                                  # → group0
GROUP2=(interview_note_tags)                                        # → interview_notes, tags
ALL=("${GROUP0[@]}" "${GROUP1[@]}" "${GROUP2[@]}")

echo "==> Exporting data from ${OLD_DB} (FK-ordered, data only)…"
wr d1 export "$OLD_DB" --remote -y --no-schema --output "$WORK/g0.sql" --table "${GROUP0[@]}"
wr d1 export "$OLD_DB" --remote -y --no-schema --output "$WORK/g1.sql" --table "${GROUP1[@]}"
wr d1 export "$OLD_DB" --remote -y --no-schema --output "$WORK/g2.sql" --table "${GROUP2[@]}"

echo "==> Clearing ${NEW_DB} data (reverse FK order) so re-runs are idempotent…"
wr d1 execute "$NEW_DB" --remote -y --command "\
DELETE FROM interview_note_tags; \
DELETE FROM post_tags; \
DELETE FROM interview_notes; \
DELETE FROM tags; \
DELETE FROM posts; \
DELETE FROM interview_sections; \
DELETE FROM pages; \
DELETE FROM site_settings; \
DELETE FROM uploads;"

echo "==> Importing into ${NEW_DB} (parents → children)…"
wr d1 execute "$NEW_DB" --remote -y --file "$WORK/g0.sql"
wr d1 execute "$NEW_DB" --remote -y --file "$WORK/g1.sql"
wr d1 execute "$NEW_DB" --remote -y --file "$WORK/g2.sql"

echo "==> Verifying row counts (old vs new)…"
mismatch=0
for t in "${ALL[@]}"; do
  old=$(wr d1 execute "$OLD_DB" --remote -y --json --command "SELECT COUNT(*) AS n FROM ${t};" | jq -r '.[0].results[0].n')
  new=$(wr d1 execute "$NEW_DB" --remote -y --json --command "SELECT COUNT(*) AS n FROM ${t};" | jq -r '.[0].results[0].n')
  flag=""
  if [ "$old" != "$new" ]; then flag="  <-- MISMATCH"; mismatch=1; fi
  printf "  %-22s old=%-6s new=%-6s%s\n" "$t" "$old" "$new" "$flag"
done

if [ "$mismatch" -ne 0 ]; then
  echo "==> DONE with MISMATCHES — investigate before relying on the new DB."
  exit 1
fi
echo "==> Done. All row counts match."
