// @vitest-environment node
//
// The `publish_date_ordering` backfill, run against the real migration file.
//
// This is the riskiest statement in the change: every public read now filters
// on `published_at <= now`, and NULL matches nothing — so a published row the
// backfill misses does not merely sort oddly, it disappears from the site. The
// harness applies migrations to an empty database, which proves the SQL parses
// and nothing more; this seeds the exact rows production has and runs it.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "migrations");
const BACKFILL = "publish_date_ordering";

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();
const backfillIndex = files.findIndex((f) => f.includes(BACKFILL));

// A fresh database per test, migrated to the state production was in the
// moment before this change lands: everything up to, and not including, the
// backfill.
let sqlite: Database.Database;

beforeEach(() => {
  sqlite = new Database(":memory:");
  for (const file of files.slice(0, backfillIndex)) {
    sqlite.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }
});
afterEach(() => sqlite.close());

function runBackfill() {
  sqlite.exec(readFileSync(join(MIGRATIONS_DIR, files[backfillIndex]), "utf8"));
}

function seedPost(slug: string, status: string, publishedAt: number | null, createdAt: number) {
  sqlite
    .prepare(
      "INSERT INTO posts (id, slug, title, content_md, status, published_at, created_at, updated_at) VALUES (?,?,?,'body',?,?,?,?)",
    )
    .run(slug, slug, slug, status, publishedAt, createdAt, createdAt);
}

describe("publish_date_ordering backfill", () => {
  it("should be a real migration file, not a name this test invented", () => {
    // The whole file is meaningless if the slice above silently matched nothing.
    expect(backfillIndex).toBeGreaterThan(0);
  });

  it("should date a published post that predates the column being stamped", () => {
    // The row production has hundreds of: published, but never stamped.
    seedPost("legacy", "published", null, 1_500_000_000);
    runBackfill();

    const row = sqlite.prepare("SELECT published_at FROM posts WHERE slug = 'legacy'").get() as {
      published_at: number | null;
    };
    expect(row.published_at).toBe(1_500_000_000);
  });

  it("should leave a post that already carries a date untouched", () => {
    // Overwriting with created_at would rewrite the archive's dates wholesale.
    seedPost("dated", "published", 1_700_000_000, 1_500_000_000);
    runBackfill();

    const row = sqlite.prepare("SELECT published_at FROM posts WHERE slug = 'dated'").get() as {
      published_at: number | null;
    };
    expect(row.published_at).toBe(1_700_000_000);
  });

  it("should leave a draft undated so it does not become a live post", () => {
    seedPost("wip", "draft", null, 1_500_000_000);
    runBackfill();

    const row = sqlite.prepare("SELECT published_at FROM posts WHERE slug = 'wip'").get() as {
      published_at: number | null;
    };
    expect(row.published_at).toBeNull();
  });

  it("should date published interview notes too, which never had the column stamped at all", () => {
    sqlite
      .prepare(
        "INSERT INTO interview_sections (id, slug, label, blurb, icon, sort_order) VALUES ('s','coding','Coding','','',0)",
      )
      .run();
    sqlite
      .prepare(
        "INSERT INTO interview_notes (id, slug, section_id, title, content_md, status, published_at, created_at, updated_at) VALUES ('n','two-sum','s','Two Sum','body','published',NULL,?,?)",
      )
      .run(1_500_000_000, 1_500_000_000);

    runBackfill();

    const row = sqlite
      .prepare("SELECT published_at FROM interview_notes WHERE slug = 'two-sum'")
      .get() as { published_at: number | null };
    expect(row.published_at).toBe(1_500_000_000);
  });
});
