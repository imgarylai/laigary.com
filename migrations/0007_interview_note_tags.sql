-- Junction table for interview notes ↔ tags (reuses existing tags table)
CREATE TABLE interview_note_tags (
  note_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES interview_notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_interview_note_tags_tag_id ON interview_note_tags(tag_id);
