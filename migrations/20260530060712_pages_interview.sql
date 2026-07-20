-- Pages table (generic content pages: now, about)
CREATE TABLE pages (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_pages_slug ON pages(slug);

-- Interview sections
CREATE TABLE interview_sections (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  blurb TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Interview notes
CREATE TABLE interview_notes (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL,
  section_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL DEFAULT '',
  tags TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (section_id) REFERENCES interview_sections(id) ON DELETE CASCADE,
  UNIQUE(section_id, slug)
);

CREATE INDEX idx_interview_notes_section ON interview_notes(section_id);
