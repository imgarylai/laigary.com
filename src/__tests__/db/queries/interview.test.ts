// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { seedNote, seedSection as seedSectionRow } from "../../factories";

const harness = setupTestDb();

const seedSection = (slug = "leetcode", label = "LeetCode") =>
  seedSectionRow({ slug, label, blurb: "...", icon: "[#]", sortOrder: 0 });

/**
 * Spread the given notes over distinct, ascending timestamps — listed oldest
 * first.
 *
 * `interview_notes.created_at`/`updated_at` come from the DB default, so notes
 * seeded in a tight loop all share one second and ordering is unobservable
 * rather than merely unasserted. Restamping makes chronology something the
 * query can actually get wrong.
 */
function ageNotes(slugs: string[]) {
  const stmt = harness.sqlite.prepare(
    "UPDATE interview_notes SET created_at = ?, updated_at = ? WHERE slug = ?",
  );
  for (const [i, slug] of slugs.entries()) {
    const at = (i + 1) * 1_000_000;
    stmt.run(at, at, slug);
  }
}

describe("createSection", () => {
  it("inserts a new section", async () => {
    const { createSection, getInterviewSections } = await import("@/db/queries");
    const { id } = await createSection({
      slug: "sd",
      label: "System Design",
      blurb: "scale",
      icon: "[*]",
    });
    const all = await getInterviewSections();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(id);
    expect(all[0].slug).toBe("sd");
  });

  it("throws SectionConflictError on duplicate slug", async () => {
    const { createSection, SectionConflictError } = await import("@/db/queries");
    await createSection({ slug: "x", label: "X", blurb: "", icon: "" });
    await expect(
      createSection({ slug: "x", label: "Y", blurb: "", icon: "" }),
    ).rejects.toBeInstanceOf(SectionConflictError);
  });
});

describe("updateSection", () => {
  it("updates label", async () => {
    const { updateSection, getInterviewSectionBySlug } = await import("@/db/queries");
    const { id } = await seedSection();
    await updateSection(id, { label: "LC v2" });
    const section = await getInterviewSectionBySlug("leetcode");
    expect(section?.label).toBe("LC v2");
  });

  it("throws SectionNotFoundError for unknown id", async () => {
    const { updateSection, SectionNotFoundError } = await import("@/db/queries");
    await expect(updateSection("missing", { label: "x" })).rejects.toBeInstanceOf(
      SectionNotFoundError,
    );
  });
});

describe("deleteSection", () => {
  it("removes the section", async () => {
    const { deleteSection, getInterviewSections } = await import("@/db/queries");
    const { id } = await seedSection();
    await deleteSection(id);
    const all = await getInterviewSections();
    expect(all).toHaveLength(0);
  });

  it("throws SectionNotFoundError for unknown id", async () => {
    const { deleteSection, SectionNotFoundError } = await import("@/db/queries");
    await expect(deleteSection("missing")).rejects.toBeInstanceOf(SectionNotFoundError);
  });
});

describe("createNote", () => {
  it("inserts a note tied to a section", async () => {
    const { createNote, getInterviewNote } = await import("@/db/queries");
    const section = await seedSection();
    await createNote({
      slug: "two-sum",
      sectionId: section.id,
      title: "Two Sum",
      contentMd: "body",
      status: "published",
    });
    const note = await getInterviewNote("leetcode", "two-sum");
    expect(note?.title).toBe("Two Sum");
  });

  it("defaults to draft and is hidden from public queries", async () => {
    const { createNote, getInterviewNote, getInterviewNoteById } = await import("@/db/queries");
    const section = await seedSection();
    const { id } = await createNote({ slug: "wip", sectionId: section.id, title: "WIP" });

    expect(await getInterviewNote("leetcode", "wip")).toBeNull();
    expect((await getInterviewNoteById(id))?.status).toBe("draft");
  });

  it("sets publishedAt when created as published", async () => {
    const { createNote, getInterviewNoteById } = await import("@/db/queries");
    const section = await seedSection();
    const { id } = await createNote({
      slug: "live",
      sectionId: section.id,
      title: "Live",
      status: "published",
    });
    const note = await getInterviewNoteById(id);
    expect(note?.publishedAt).toBeTypeOf("number");
  });

  it("attaches tags via interview_note_tags", async () => {
    const { createNote, createTag, getInterviewNote } = await import("@/db/queries");
    const section = await seedSection();
    const tag = await createTag({ name: "DP", slug: "dp" });
    await createNote({
      slug: "knapsack",
      sectionId: section.id,
      title: "Knapsack",
      tagIds: [tag.id],
      status: "published",
    });
    const note = await getInterviewNote("leetcode", "knapsack");
    expect(note?.tags.map((t) => t.slug)).toEqual(["dp"]);
  });

  it("throws NoteConflictError on duplicate slug within section", async () => {
    const { createNote, NoteConflictError } = await import("@/db/queries");
    const section = await seedSection();
    await createNote({ slug: "n", sectionId: section.id, title: "A" });
    await expect(
      createNote({ slug: "n", sectionId: section.id, title: "B" }),
    ).rejects.toBeInstanceOf(NoteConflictError);
  });

  it("leaves no orphan row behind when the tag write fails", async () => {
    // Mirrors the posts side: without atomicity the note row is committed
    // before the tag insert fails, so a reported failure still leaves a note.
    const { createNote, getInterviewNotesBySection } = await import("@/db/queries");
    const section = await seedSection();

    await expect(
      createNote({
        slug: "n",
        sectionId: section.id,
        title: "A",
        // Published, or the listing below filters the orphan out anyway and the
        // assertion would hold whether or not the row was rolled back.
        status: "published",
        tagIds: ["does-not-exist"],
      }),
    ).rejects.toThrow();

    const { total } = await getInterviewNotesBySection(section.slug);
    expect(total).toBe(0);
  });
});

describe("updateNote", () => {
  it("replaces tags when tagIds provided", async () => {
    const { createNote, updateNote, createTag, getInterviewNote } = await import("@/db/queries");
    const section = await seedSection();
    const a = await createTag({ name: "A", slug: "a" });
    const b = await createTag({ name: "B", slug: "b" });
    const { id } = await createNote({
      slug: "n",
      sectionId: section.id,
      title: "T",
      tagIds: [a.id],
      status: "published",
    });

    await updateNote(id, { tagIds: [b.id] });
    const note = await getInterviewNote("leetcode", "n");
    expect(note?.tags.map((t) => t.slug)).toEqual(["b"]);
  });

  it("clears tags when tagIds is empty array", async () => {
    const { createNote, updateNote, createTag, getInterviewNote } = await import("@/db/queries");
    const section = await seedSection();
    const a = await createTag({ name: "A", slug: "a" });
    const { id } = await createNote({
      slug: "n",
      sectionId: section.id,
      title: "T",
      tagIds: [a.id],
      status: "published",
    });

    await updateNote(id, { tagIds: [] });
    const note = await getInterviewNote("leetcode", "n");
    expect(note?.tags).toEqual([]);
  });

  it("changes the slug", async () => {
    const { createNote, updateNote, getInterviewNote } = await import("@/db/queries");
    const section = await seedSection();
    const { id } = await createNote({
      slug: "old",
      sectionId: section.id,
      title: "T",
      status: "published",
    });
    await updateNote(id, { slug: "new" });
    expect(await getInterviewNote("leetcode", "old")).toBeNull();
    expect((await getInterviewNote("leetcode", "new"))?.title).toBe("T");
  });

  it("throws NoteConflictError when slug collides with another note in the section", async () => {
    const { createNote, updateNote, NoteConflictError } = await import("@/db/queries");
    const section = await seedSection();
    await createNote({ slug: "taken", sectionId: section.id, title: "Taken" });
    const { id } = await createNote({ slug: "free", sectionId: section.id, title: "Free" });

    await expect(updateNote(id, { slug: "taken" })).rejects.toBeInstanceOf(NoteConflictError);
  });

  it("should persist pinned across unrelated updates and clear it when set to false", async () => {
    const { createNote, updateNote, getInterviewNoteById } = await import("@/db/queries");
    const section = await seedSection();
    const { id } = await createNote({
      slug: "p",
      sectionId: section.id,
      title: "T",
      status: "published",
      pinned: true,
    });
    expect((await getInterviewNoteById(id))?.pinned).toBe(1);

    await updateNote(id, { title: "T2" });
    expect((await getInterviewNoteById(id))?.pinned).toBe(1);

    await updateNote(id, { pinned: false });
    expect((await getInterviewNoteById(id))?.pinned).toBe(0);

    await updateNote(id, { pinned: true });
    expect((await getInterviewNoteById(id))?.pinned).toBe(1);
  });

  it("flips publishedAt when transitioning draft → published", async () => {
    const { createNote, updateNote, getInterviewNoteById } = await import("@/db/queries");
    const section = await seedSection();
    const { id } = await createNote({ slug: "d", sectionId: section.id, title: "T" });

    await updateNote(id, { status: "published" });
    const note = await getInterviewNoteById(id);
    expect(note?.status).toBe("published");
    expect(note?.publishedAt).toBeTypeOf("number");
  });

  it("throws NoteNotFoundError for unknown id", async () => {
    const { updateNote, NoteNotFoundError } = await import("@/db/queries");
    await expect(updateNote("missing", { title: "x" })).rejects.toBeInstanceOf(NoteNotFoundError);
  });

  it("should stamp updatedAt when touchUpdatedAt defaults, and leave it when false", async () => {
    const { createNote, updateNote, getInterviewNoteById } = await import("@/db/queries");
    const section = await seedSection();
    const { id } = await createNote({ slug: "u", sectionId: section.id, title: "T" });
    const original = (await getInterviewNoteById(id))?.updatedAt;
    expect(original).toBeTypeOf("number");

    // Only Date is faked: the query layer reads Date.now() for the stamp, and
    // faking timers wholesale would stall the awaits below.
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));

      // A correction: the edit lands but the note is not resurfaced.
      await updateNote(id, { title: "T2" }, { touchUpdatedAt: false });
      const corrected = await getInterviewNoteById(id);
      expect(corrected?.title).toBe("T2");
      expect(corrected?.updatedAt).toBe(original);

      // Real new content: the stamp moves.
      await updateNote(id, { title: "T3" });
      expect((await getInterviewNoteById(id))?.updatedAt).toBe(1_893_456_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("leaves the row and its tags untouched when the tag write fails", async () => {
    // Mirrors the posts side. Note this one is worse on main: updateNote's
    // try/catch wraps only the UPDATE, so the tag writes sit outside it.
    const { createNote, updateNote, createTag, getInterviewNoteById } =
      await import("@/db/queries");
    const section = await seedSection();
    const tag = await createTag({ name: "Go", slug: "go" });
    const { id } = await createNote({
      slug: "n",
      sectionId: section.id,
      title: "Original",
      tagIds: [tag.id],
    });

    await expect(
      updateNote(id, { title: "Renamed", tagIds: ["does-not-exist"] }),
    ).rejects.toThrow();

    const after = await getInterviewNoteById(id);
    expect(after?.title).toBe("Original");
    expect(after?.tags.map((t) => t.slug)).toEqual(["go"]);
  });
});

describe("deleteNote", () => {
  it("removes the note", async () => {
    const { createNote, deleteNote, getInterviewNote } = await import("@/db/queries");
    const section = await seedSection();
    const { id } = await createNote({ slug: "n", sectionId: section.id, title: "T" });
    await deleteNote(id);
    expect(await getInterviewNote("leetcode", "n")).toBeNull();
  });

  it("throws NoteNotFoundError for unknown id", async () => {
    const { deleteNote, NoteNotFoundError } = await import("@/db/queries");
    await expect(deleteNote("missing")).rejects.toBeInstanceOf(NoteNotFoundError);
  });
});

describe("getInterviewNotesBySection", () => {
  it("hides drafts from public list", async () => {
    const { createNote, getInterviewNotesBySection } = await import("@/db/queries");
    const section = await seedSection();
    await createNote({
      slug: "live",
      sectionId: section.id,
      title: "Live",
      status: "published",
    });
    await createNote({ slug: "draft", sectionId: section.id, title: "Draft" });

    const result = await getInterviewNotesBySection("leetcode");
    expect(result.total).toBe(1);
    expect(result.notes[0].slug).toBe("live");
  });

  it("filters by tag slug", async () => {
    const { createNote, createTag, getInterviewNotesBySection } = await import("@/db/queries");
    const section = await seedSection();
    const dp = await createTag({ name: "DP", slug: "dp" });
    await createNote({
      slug: "a",
      sectionId: section.id,
      title: "A",
      tagIds: [dp.id],
      status: "published",
    });
    await createNote({
      slug: "b",
      sectionId: section.id,
      title: "B",
      status: "published",
    });

    const result = await getInterviewNotesBySection("leetcode", { tag: "dp" });
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0].slug).toBe("a");
  });

  it("paginates with limit/offset", async () => {
    const { createNote, getInterviewNotesBySection } = await import("@/db/queries");
    const section = await seedSection();
    for (let i = 0; i < 5; i++) {
      await createNote({
        slug: `n${i}`,
        sectionId: section.id,
        title: `N${i}`,
        status: "published",
      });
    }
    ageNotes(["n0", "n1", "n2", "n3", "n4"]);

    // Exact slices at two different offsets. A count alone stays correct even
    // when offset is ignored entirely and page 1 repeats forever.
    const page = await getInterviewNotesBySection("leetcode", { limit: 2, offset: 1 });
    expect(page.notes.map((n) => n.slug)).toEqual(["n3", "n2"]);
    expect(page.total).toBe(5);

    const last = await getInterviewNotesBySection("leetcode", { limit: 2, offset: 3 });
    expect(last.notes.map((n) => n.slug)).toEqual(["n1", "n0"]);
  });

  it("should filter by tag name when given one instead of a slug", async () => {
    // The section page's `?tag=` chips carry names, and a name is not a slug —
    // filtering the URL value against `tags.slug` matches nothing at all.
    const { createNote, createTag, getInterviewNotesBySection } = await import("@/db/queries");
    const section = await seedSection();
    const dp = await createTag({ name: "Dynamic Programming", slug: "dp" });
    await createNote({
      slug: "a",
      sectionId: section.id,
      title: "A",
      tagIds: [dp.id],
      status: "published",
    });
    await createNote({ slug: "b", sectionId: section.id, title: "B", status: "published" });

    const byName = await getInterviewNotesBySection("leetcode", {
      tagName: "Dynamic Programming",
    });
    expect(byName.notes.map((n) => n.slug)).toEqual(["a"]);
    expect(byName.total).toBe(1);
  });

  it("should leave pinned notes out of the list and its total when asked to", async () => {
    // The section page renders pinned notes in their own block above the list,
    // so counting them in the total would size the pager for rows it never
    // shows — and the last page would come back short.
    const { createNote, getInterviewNotesBySection } = await import("@/db/queries");
    const section = await seedSection();
    await createNote({
      slug: "pin",
      sectionId: section.id,
      title: "Pin",
      pinned: true,
      status: "published",
    });
    await createNote({ slug: "plain", sectionId: section.id, title: "Plain", status: "published" });

    const result = await getInterviewNotesBySection("leetcode", { excludePinned: true });
    expect(result.notes.map((n) => n.slug)).toEqual(["plain"]);
    expect(result.total).toBe(1);
  });

  it("should return nothing when the tag exists but carries no notes here", async () => {
    // The chip row is per section, but a tag is global — one carried only by
    // posts, or only by another section's notes, reaches this page as a filter
    // that matches nothing.
    const { createTag, getInterviewNotesBySection } = await import("@/db/queries");
    const section = await seedSection();
    await seedNote(section.id, { slug: "a" });
    await createTag({ name: "Unused", slug: "unused" });

    expect(await getInterviewNotesBySection("leetcode", { tagName: "Unused" })).toEqual({
      notes: [],
      total: 0,
    });
  });

  it("returns empty when section doesn't exist", async () => {
    const { getInterviewNotesBySection } = await import("@/db/queries");
    expect(await getInterviewNotesBySection("nope")).toEqual({ notes: [], total: 0 });
  });

  it("should list pinned notes before newer unpinned ones", async () => {
    const { createNote, getInterviewNotesBySection } = await import("@/db/queries");
    const section = await seedSection();
    await createNote({
      slug: "old-pinned",
      sectionId: section.id,
      title: "Old Pinned",
      status: "published",
      pinned: true,
    });
    await createNote({
      slug: "newer",
      sectionId: section.id,
      title: "Newer",
      status: "published",
    });
    // Age the pinned note so createdAt ordering alone would put it last.
    harness.sqlite
      .prepare("UPDATE interview_notes SET created_at = created_at - 1000 WHERE slug = ?")
      .run("old-pinned");

    const result = await getInterviewNotesBySection("leetcode");
    expect(result.notes.map((n) => n.slug)).toEqual(["old-pinned", "newer"]);
    expect(result.notes[0].pinned).toBe(1);
  });
});

describe("getPublishedNotesByTag", () => {
  it("should return published notes across sections carrying a tag slug", async () => {
    const { createTag, getPublishedNotesByTag } = await import("@/db/queries");
    const tag = await createTag({ name: "Monotonic", slug: "monotonic" });
    const s1 = await seedSection("coding", "Coding");
    const s2 = await seedSection("systems", "Systems");
    await seedNote(s1.id, { slug: "stack", title: "Stack", status: "published", tagIds: [tag.id] });
    await seedNote(s2.id, { slug: "queue", title: "Queue", status: "published", tagIds: [tag.id] });
    await seedNote(s1.id, { slug: "other", title: "Other", status: "published" });

    ageNotes(["stack", "queue", "other"]);

    // Exact array, not arrayContaining: this feed is ordered newest-first and
    // a containment check cannot see that.
    const notes = await getPublishedNotesByTag("monotonic");
    expect(
      notes.map((n) => ({ slug: n.slug, section: n.sectionSlug, label: n.sectionLabel })),
    ).toEqual([
      { slug: "queue", section: "systems", label: "Systems" },
      { slug: "stack", section: "coding", label: "Coding" },
    ]);
  });

  it("should exclude drafts and return empty for an unused tag", async () => {
    const { createTag, getPublishedNotesByTag } = await import("@/db/queries");
    const tag = await createTag({ name: "Draft", slug: "draft-tag" });
    const s = await seedSection("coding", "Coding");
    await seedNote(s.id, { slug: "wip", status: "draft", tagIds: [tag.id] });

    expect(await getPublishedNotesByTag("draft-tag")).toEqual([]);
    expect(await getPublishedNotesByTag("nope")).toEqual([]);
  });
});

describe("getPublishedNoteIndex", () => {
  it("should list published notes with their section slug when called", async () => {
    const { getPublishedNoteIndex } = await import("@/db/queries");
    const section = await seedSection("coding");
    await seedNote(section.id, { slug: "two-sum", title: "Two Sum", status: "published" });
    await seedNote(section.id, { slug: "hidden", title: "Hidden", status: "draft" });

    const index = await getPublishedNoteIndex();
    expect(index).toEqual([{ slug: "two-sum", sectionSlug: "coding", title: "Two Sum" }]);
  });
});

describe("searchAdminInterviewNotes", () => {
  it("matches titles across sections and statuses, with the section slug", async () => {
    const { createNote, searchAdminInterviewNotes } = await import("@/db/queries");
    const lc = await seedSection();
    const sd = await seedSection("system-design", "System Design");

    await createNote({ slug: "two-sum", sectionId: lc.id, title: "Two Sum", status: "published" });
    await createNote({ slug: "sum-types", sectionId: sd.id, title: "Sum Types" });
    await createNote({ slug: "bfs", sectionId: lc.id, title: "BFS Template", status: "published" });

    ageNotes(["two-sum", "sum-types"]);

    // Not .sort(): this list is ordered by updatedAt desc, and sorting the
    // result of an ordering query asserts nothing about the ordering.
    const hits = await searchAdminInterviewNotes("Sum");
    expect(hits.map((h) => h.slug)).toEqual(["sum-types", "two-sum"]);
    expect(hits.find((h) => h.slug === "two-sum")).toMatchObject({
      sectionSlug: "leetcode",
      status: "published",
    });
    expect(hits.find((h) => h.slug === "sum-types")).toMatchObject({
      sectionSlug: "system-design",
      status: "draft",
    });
  });

  it("caps results at the limit", async () => {
    const { createNote, searchAdminInterviewNotes } = await import("@/db/queries");
    const section = await seedSection();
    for (let i = 0; i < 4; i++) {
      await createNote({ slug: `note-${i}`, sectionId: section.id, title: `Graph ${i}` });
    }
    expect(await searchAdminInterviewNotes("Graph", 2)).toHaveLength(2);
  });
});

describe("getTagsInSection", () => {
  it("returns distinct tags from published notes only", async () => {
    const { createNote, createTag, getTagsInSection } = await import("@/db/queries");
    const section = await seedSection();
    const zeta = await createTag({ name: "Zeta", slug: "zeta" });
    const alpha = await createTag({ name: "Alpha", slug: "alpha" });
    const drafts = await createTag({ name: "Drafts", slug: "drafts" });

    // The query scans interview_note_tags, so what decides the unordered result
    // is the order the LINKS are written — not the order the tags were created.
    // Link zeta first on both notes: drop `asc(tags.name)` and the chip row
    // comes back ["zeta", "alpha"].
    await createNote({
      slug: "n1",
      sectionId: section.id,
      title: "N1",
      tagIds: [zeta.id],
      status: "published",
    });
    await createNote({
      slug: "n2",
      sectionId: section.id,
      title: "N2",
      tagIds: [zeta.id, alpha.id],
      status: "published",
    });
    // Draft shouldn't contribute its tag
    await createNote({
      slug: "wip",
      sectionId: section.id,
      title: "WIP",
      tagIds: [drafts.id],
    });

    const tags = await getTagsInSection("leetcode");
    expect(tags.map((t) => t.slug)).toEqual(["alpha", "zeta"]);
  });

  it("should return no chips for an unknown section", async () => {
    const { getTagsInSection } = await import("@/db/queries");
    expect(await getTagsInSection("nope")).toEqual([]);
  });

  // Cached: the chip row costs a full scan of the section's notes plus a
  // junction walk, on a query every section view runs. It still has to notice
  // a publish.
  it("should serve the chip row from cache until a note mutation invalidates it", async () => {
    const { createNote, createTag, getTagsInSection } = await import("@/db/queries");
    const section = await seedSection();
    const alpha = await createTag({ name: "Alpha", slug: "alpha" });
    const zeta = await createTag({ name: "Zeta", slug: "zeta" });
    await createNote({
      slug: "n1",
      sectionId: section.id,
      title: "N1",
      tagIds: [alpha.id],
      status: "published",
    });
    expect((await getTagsInSection("leetcode")).map((t) => t.slug)).toEqual(["alpha"]);

    // Link zeta behind the query layer's back — a stale row here proves the
    // second read never reached the database.
    harness.sqlite
      .prepare(
        "INSERT INTO interview_note_tags (note_id, tag_id) SELECT id, ? FROM interview_notes WHERE slug = 'n1'",
      )
      .run(zeta.id);
    expect((await getTagsInSection("leetcode")).map((t) => t.slug)).toEqual(["alpha"]);

    // A real note write invalidates.
    await createNote({
      slug: "n2",
      sectionId: section.id,
      title: "N2",
      tagIds: [zeta.id],
      status: "published",
    });
    expect((await getTagsInSection("leetcode")).map((t) => t.slug)).toEqual(["alpha", "zeta"]);
  });
});

describe("getAllAdminInterviewNotes", () => {
  it("should include note slug and section slug when listing for the admin table", async () => {
    const { createNote, getAllAdminInterviewNotes } = await import("@/db/queries");
    const section = await seedSection();
    await createNote({
      slug: "two-sum",
      sectionId: section.id,
      title: "Two Sum",
      status: "published",
    });

    const notes = await getAllAdminInterviewNotes();
    expect(notes).toHaveLength(1);
    // slug pair feeds the admin table's view-live-page link (/interview/$sect/$slug)
    expect(notes[0]).toMatchObject({
      slug: "two-sum",
      sectionSlug: "leetcode",
      sectionLabel: "LeetCode",
      status: "published",
    });
  });
});

// The single most expensive query on the site before it was cached: counting
// published notes examines every row, so it read ~900 rows per call to return
// three numbers, ~5.3k times in half an hour.
describe("getInterviewNoteCountsBySection caching", () => {
  it("should serve counts from cache until a note mutation invalidates them", async () => {
    const { createNote, getInterviewNoteCountsBySection } = await import("@/db/queries");
    const section = await seedSection();
    await createNote({ slug: "n1", sectionId: section.id, title: "N1", status: "published" });
    expect((await getInterviewNoteCountsBySection()).get(section.id)).toBe(1);

    // Insert behind the query layer's back — a stale count here is the proof
    // that the second read never reached the database.
    harness.sqlite
      .prepare(
        "INSERT INTO interview_notes (id, slug, section_id, title, content_md, status) VALUES ('x','n2',?,'N2','','published')",
      )
      .run(section.id);
    expect((await getInterviewNoteCountsBySection()).get(section.id)).toBe(1);

    // A real publish goes through createNote, which invalidates.
    await createNote({ slug: "n3", sectionId: section.id, title: "N3", status: "published" });
    expect((await getInterviewNoteCountsBySection()).get(section.id)).toBe(3);
  });
});

describe("getInterviewSections caching", () => {
  it("should serve the section list from cache until a section mutation invalidates it", async () => {
    const { createSection, getInterviewSections } = await import("@/db/queries");
    await seedSection();
    expect((await getInterviewSections()).map((s) => s.slug)).toEqual(["leetcode"]);

    harness.sqlite
      .prepare(
        "INSERT INTO interview_sections (id, slug, label, blurb, icon, sort_order) VALUES ('x','behind','B','','',9)",
      )
      .run();
    expect((await getInterviewSections()).map((s) => s.slug)).toEqual(["leetcode"]);

    await createSection({ slug: "system-design", label: "SD", blurb: "", icon: "", sortOrder: 1 });
    expect((await getInterviewSections()).map((s) => s.slug)).toContain("system-design");
  });
});

describe("getPinnedInterviewNotes", () => {
  it("should return only published pinned notes in the section", async () => {
    const { createNote, getPinnedInterviewNotes } = await import("@/db/queries");
    const section = await seedSection();
    const other = await seedSection("system-design", "System Design");
    await createNote({
      slug: "pin",
      sectionId: section.id,
      title: "Pin",
      pinned: true,
      status: "published",
    });
    // Each of these fails a different clause of the WHERE.
    await createNote({ slug: "plain", sectionId: section.id, title: "Plain", status: "published" });
    await createNote({ slug: "draft", sectionId: section.id, title: "Draft", pinned: true });
    await createNote({
      slug: "elsewhere",
      sectionId: other.id,
      title: "Elsewhere",
      pinned: true,
      status: "published",
    });

    const pinned = await getPinnedInterviewNotes("leetcode");
    expect(pinned.map((n) => n.slug)).toEqual(["pin"]);
  });

  it("should return nothing for an unknown section", async () => {
    const { getPinnedInterviewNotes } = await import("@/db/queries");
    expect(await getPinnedInterviewNotes("nope")).toEqual([]);
  });
});

describe("getAdminInterviewNotes", () => {
  it("returns a page of notes with section metadata and the full total", async () => {
    const { getAdminInterviewNotes } = await import("@/db/queries");
    const section = await seedSection();
    await seedNote(section.id, { slug: "a" });
    await seedNote(section.id, { slug: "b" });
    await seedNote(section.id, { slug: "c", status: "draft" });

    const all = await getAdminInterviewNotes();
    expect(all.total).toBe(3);
    expect(all.items[0].sectionSlug).toBe("leetcode");

    const page = await getAdminInterviewNotes({ limit: 2, offset: 2 });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(3);
  });
});

describe("non-conflict error rethrow", () => {
  it("createSection rethrows non-UNIQUE errors untouched", async () => {
    const { createSection, SectionConflictError } = await import("@/db/queries");
    const err = await createSection({
      slug: "x",
      label: undefined as never,
      blurb: "",
      icon: "",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(SectionConflictError);
  });

  it("updateNote rethrows transient (non-UNIQUE) errors untouched", async () => {
    const { createNote, updateNote, NoteConflictError } = await import("@/db/queries");
    const section = await seedSection();
    const { id } = await createNote({ slug: "n", sectionId: section.id, title: "T" });

    // A transient failure (disk I/O) can't be produced through the public API
    // — every field has a ?? fallback and the schema has no CHECK constraints
    // — so this is the sanctioned transient-error mock (see AGENTS.md): throw
    // once from the harness db, everything else stays on the real database.
    const spy = vi.spyOn(harness.db, "update").mockImplementationOnce(() => {
      throw new Error("disk I/O error");
    });

    const err = await updateNote(id, { title: "T2" }).catch((e) => e);
    spy.mockRestore();
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("disk I/O error");
    expect(err).not.toBeInstanceOf(NoteConflictError);
  });

  it("createNote rethrows non-UNIQUE errors untouched", async () => {
    const { createNote, NoteConflictError } = await import("@/db/queries");
    const section = await seedSection();
    const err = await createNote({
      slug: "x",
      sectionId: section.id,
      title: undefined as never,
    }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(NoteConflictError);
  });
});
