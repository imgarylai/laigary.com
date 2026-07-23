// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { seedNote, seedSection as seedSectionRow } from "../../factories";

const harness = setupTestDb();

const seedSection = (slug = "leetcode", label = "LeetCode") =>
  seedSectionRow({ slug, label, blurb: "...", icon: "[#]", sortOrder: 0 });

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
    const page = await getInterviewNotesBySection("leetcode", { limit: 2, offset: 1 });
    expect(page.notes).toHaveLength(2);
    expect(page.total).toBe(5);
  });

  it("returns empty when section doesn't exist", async () => {
    const { getInterviewNotesBySection } = await import("@/db/queries");
    expect(await getInterviewNotesBySection("nope")).toEqual({ notes: [], total: 0 });
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

    const notes = await getPublishedNotesByTag("monotonic");
    expect(
      notes.map((n) => ({ slug: n.slug, section: n.sectionSlug, label: n.sectionLabel })),
    ).toEqual(
      expect.arrayContaining([
        { slug: "stack", section: "coding", label: "Coding" },
        { slug: "queue", section: "systems", label: "Systems" },
      ]),
    );
    expect(notes).toHaveLength(2);
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

    const hits = await searchAdminInterviewNotes("Sum");
    expect(hits.map((h) => h.slug).sort()).toEqual(["sum-types", "two-sum"]);
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
    const a = await createTag({ name: "A", slug: "a" });
    const b = await createTag({ name: "B", slug: "b" });
    const drafts = await createTag({ name: "Drafts", slug: "drafts" });

    await createNote({
      slug: "n1",
      sectionId: section.id,
      title: "N1",
      tagIds: [a.id],
      status: "published",
    });
    await createNote({
      slug: "n2",
      sectionId: section.id,
      title: "N2",
      tagIds: [a.id, b.id],
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
    expect(tags.map((t) => t.slug).sort()).toEqual(["a", "b"]);
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
