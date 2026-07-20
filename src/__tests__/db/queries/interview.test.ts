// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { createTestDb } from "../helpers/test-db";

const harness = createTestDb();

vi.mock("drizzle-orm/d1", () => ({
  drizzle: () => harness.db,
}));

beforeEach(() => harness.truncateAll());
afterAll(() => harness.close());

async function seedSection(slug = "leetcode", label = "LeetCode") {
  const { createSection } = await import("@/db/queries");
  return createSection({ slug, label, blurb: "...", icon: "[#]", sortOrder: 0 });
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
