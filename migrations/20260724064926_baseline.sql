-- drizzle-kit baseline: intentionally a no-op.
--
-- The schema this file would create already exists — it was built by the
-- hand-written migrations above (20260530060710_init.sql through
-- 20260724062529_pinned_interview_notes.sql). This file only anchors
-- migrations/meta/20260724064926_snapshot.json, the snapshot drizzle-kit
-- diffs against, so that from here on schema changes are authored as:
--
--   1. edit src/db/schema/*.ts
--   2. pnpm exec drizzle-kit generate --name <change>
--
-- and the generated ALTER flows through the normal wrangler/Alchemy apply.
-- Do not hand-write schema migrations past this point (data backfills can
-- still be added inside a generated file, or via drizzle-kit generate
-- --custom).

SELECT 1;
