-- 0002_uuid_ids.sql
-- Switch all primary keys from INTEGER AUTOINCREMENT to TEXT (UUID)
-- No data exists yet, so drop and recreate.

DROP INDEX IF EXISTS idx_posts_status_published;
DROP INDEX IF EXISTS idx_posts_slug;
DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS uploads;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS posts;

CREATE TABLE posts (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_posts_status_published ON posts(status, published_at DESC);
CREATE INDEX idx_posts_slug ON posts(slug);

CREATE TABLE tags (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE post_tags (
  post_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE uploads (
  id TEXT PRIMARY KEY NOT NULL,
  r2_key TEXT UNIQUE NOT NULL,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
