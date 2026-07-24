-- Pinned interview notes: section listing surfaces pinned notes in a block
-- above the chronological list (used for curated index notes like
-- coding-interview-preparation). 0 = normal, 1 = pinned.

ALTER TABLE interview_notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
