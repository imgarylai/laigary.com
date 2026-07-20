-- Add publish workflow to interview_notes (mirrors posts).
-- Existing rows default to 'published' so the public site keeps showing them;
-- the application layer (createNote) defaults new rows to 'draft'.

ALTER TABLE interview_notes ADD COLUMN status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE interview_notes ADD COLUMN published_at INTEGER;

-- Backfill published_at for the existing 'published' rows so OG metadata has a date.
UPDATE interview_notes SET published_at = created_at WHERE published_at IS NULL;

CREATE INDEX idx_interview_notes_status_published ON interview_notes(status, published_at DESC);
