// Export every interview note from D1 into a git-tracked markdown file, so the
// article text has a durable, diffable history outside Cloudflare. D1's Time
// Travel is a whole-database rewind with a limited window; this gives per-note
// `git log -p`, which is what you want when the question is "what did I write
// before, and why did I change it".
//
// Run with `pnpm content:export`. Node runs this .ts directly (native type
// stripping), so there is no build step and no extra dependency — the D1 read
// goes through the wrangler CLI, same as a manual `d1 execute`.
//
// Output: content/interview/<section>/<slug>.md, YAML frontmatter + the exact
// content_md bytes. Re-running is idempotent: identical DB state produces an
// identical tree, so any git diff is a real content change.

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_ROOT = join(REPO_ROOT, "content", "interview");
const DB_NAME = "laigary-db";

interface NoteRow {
  readonly slug: string;
  readonly section: string;
  readonly title: string;
  readonly content_md: string;
  readonly status: string;
  readonly pinned: number;
  readonly created_at: number;
  readonly updated_at: number;
  readonly published_at: number | null;
  /** Comma-separated tag names from the junction table; null when untagged. */
  readonly tag_names: string | null;
}

interface D1Result {
  readonly results: readonly NoteRow[];
  readonly success: boolean;
}

const QUERY = `
  SELECT n.slug, s.slug AS section, n.title, n.content_md, n.status, n.pinned,
         n.created_at, n.updated_at, n.published_at,
         (SELECT group_concat(t.name, ',')
            FROM interview_note_tags x JOIN tags t ON t.id = x.tag_id
           WHERE x.note_id = n.id) AS tag_names
    FROM interview_notes n
    JOIN interview_sections s ON s.id = n.section_id
   ORDER BY s.slug, n.slug
`
  .replace(/\s+/g, " ")
  .trim();

function fetchNotes(): readonly NoteRow[] {
  // --json keeps stdout machine-readable; wrangler still writes its banner to stderr.
  const stdout = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", DB_NAME, "--remote", "--json", "--command", QUERY],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
  const parsed: unknown = JSON.parse(stdout);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("unexpected wrangler output: expected a non-empty array of results");
  }
  const first = parsed[0] as D1Result;
  if (!first.success || !Array.isArray(first.results)) {
    throw new Error("D1 query did not succeed");
  }
  return first.results;
}

/** Double-quoted YAML scalars are JSON string literals, so JSON.stringify is a correct encoder. */
function yamlString(value: string): string {
  return JSON.stringify(value);
}

function frontmatter(note: NoteRow): string {
  const tags = (note.tag_names ?? "")
    .split(",")
    .filter((t) => t.length > 0)
    .sort((a, b) => a.localeCompare(b));
  const lines = [
    "---",
    `slug: ${yamlString(note.slug)}`,
    `section: ${yamlString(note.section)}`,
    `title: ${yamlString(note.title)}`,
    `status: ${yamlString(note.status)}`,
    `pinned: ${note.pinned === 1}`,
    `tags: [${tags.map(yamlString).join(", ")}]`,
    `created_at: ${note.created_at}`,
    `updated_at: ${note.updated_at}`,
    `published_at: ${note.published_at ?? "null"}`,
    "---",
    "",
  ];
  return lines.join("\n");
}

/** Delete .md files this export no longer produces, so a removed note leaves the tree. */
function pruneStale(managedDirs: ReadonlySet<string>, written: ReadonlySet<string>): number {
  let removed = 0;
  for (const dir of managedDirs) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const path = join(dir, entry.name);
      if (written.has(path)) continue;
      rmSync(path);
      console.log(`  removed ${relative(REPO_ROOT, path)}`);
      removed += 1;
    }
  }
  return removed;
}

const notes = fetchNotes();
const written = new Set<string>();
const dirs = new Set<string>();
let noTrailingNewline = 0;

for (const note of notes) {
  const dir = join(OUT_ROOT, note.section);
  mkdirSync(dir, { recursive: true });
  dirs.add(dir);
  const path = join(dir, `${note.slug}.md`);
  // content_md is written byte-for-byte so the file round-trips back into D1.
  writeFileSync(path, frontmatter(note) + note.content_md);
  written.add(path);
  if (!note.content_md.endsWith("\n")) noTrailingNewline += 1;
}

const removed = pruneStale(dirs, written);
const bySection = new Map<string, number>();
for (const note of notes) bySection.set(note.section, (bySection.get(note.section) ?? 0) + 1);

console.log(`exported ${notes.length} notes to ${relative(REPO_ROOT, OUT_ROOT)}/`);
for (const [section, count] of [...bySection].sort()) console.log(`  ${section}: ${count}`);
if (removed > 0) console.log(`pruned ${removed} stale file(s)`);
if (noTrailingNewline > 0) {
  console.log(`note: ${noTrailingNewline} note(s) have no trailing newline in D1 (kept verbatim)`);
}
