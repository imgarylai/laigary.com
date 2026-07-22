// In-memory SQLite + Drizzle test harness. Mirrors the production D1 schema
// by applying the same migrations/*.sql files. Use vi.mock("@/db/queries/_db")
// to redirect getDb() to the returned drizzle instance.

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeEach, vi } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "migrations");

export type TestDb = ReturnType<typeof drizzle>;

export function createTestDb() {
  const sqlite = new Database(":memory:");
  // D1 enforces foreign keys; mirror that here so onDelete cascade rules apply.
  sqlite.pragma("foreign_keys = ON");

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    sqlite.exec(sql);
  }

  const db = drizzle(sqlite);

  return {
    db,
    sqlite,
    close: () => sqlite.close(),
    /** Delete all rows from every user table — call in beforeEach for isolation. */
    truncateAll: () => {
      const tables = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[];
      sqlite.pragma("foreign_keys = OFF");
      for (const { name } of tables) {
        sqlite.exec(`DELETE FROM ${name}`);
      }
      sqlite.pragma("foreign_keys = ON");
    },
  };
}

// One-call harness for query-layer test files: creates the in-memory DB,
// redirects `drizzle-orm/d1` at it (vi.doMock — registered at file-eval time,
// before the tests' dynamic `await import("@/db/queries")`), and wires the
// truncate/close lifecycle. Call at the top level of the test file.
export function setupTestDb() {
  const harness = createTestDb();

  vi.doMock("drizzle-orm/d1", () => ({
    drizzle: () => harness.db,
  }));

  beforeEach(() => {
    harness.truncateAll();
  });

  afterAll(() => {
    harness.close();
  });

  return harness;
}
