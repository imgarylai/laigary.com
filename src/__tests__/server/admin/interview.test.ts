import { describe, it, expect, vi, beforeEach } from "vitest";
import * as queries from "@/db/queries";
import {
  SectionConflictError,
  SectionNotFoundError,
  NoteConflictError,
  NoteNotFoundError,
} from "@/db/queries";
import {
  createSectionImpl,
  updateSectionImpl,
  deleteSectionImpl,
  createNoteImpl,
  updateNoteImpl,
  deleteNoteImpl,
  sectionCreateSchema,
  noteCreateSchema,
} from "@/server/admin/interview";

vi.mock("@/db/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/queries")>();
  return {
    ...actual,
    createSection: vi.fn(),
    updateSection: vi.fn(),
    deleteSection: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
  };
});

beforeEach(() => vi.clearAllMocks());

const validSection = { slug: "leetcode", label: "LeetCode", blurb: "", icon: "code" };
const validNote = { slug: "two-sum", sectionId: "s1", title: "Two Sum" };

describe("sections", () => {
  it("createSectionImpl returns the created ref", async () => {
    vi.mocked(queries.createSection).mockResolvedValue({ id: "s1", slug: "leetcode" });
    const res = await createSectionImpl(validSection);
    expect(queries.createSection).toHaveBeenCalledWith(validSection);
    expect(res).toEqual({ ok: true, data: { id: "s1", slug: "leetcode" } });
  });

  it("createSectionImpl maps a conflict", async () => {
    vi.mocked(queries.createSection).mockRejectedValue(new SectionConflictError("dup"));
    expect(await createSectionImpl(validSection)).toEqual({ ok: false, error: "dup" });
  });

  it("updateSectionImpl splits id and forwards the rest", async () => {
    vi.mocked(queries.updateSection).mockResolvedValue(undefined);
    expect(await updateSectionImpl({ id: "s1", label: "LC" })).toEqual({ ok: true });
    expect(queries.updateSection).toHaveBeenCalledWith("s1", { label: "LC" });
  });

  it("deleteSectionImpl maps not-found", async () => {
    vi.mocked(queries.deleteSection).mockRejectedValue(new SectionNotFoundError("s1"));
    expect(await deleteSectionImpl({ id: "s1" })).toEqual({
      ok: false,
      error: "Section s1 not found",
    });
  });
});

describe("notes", () => {
  it("createNoteImpl returns the created ref", async () => {
    vi.mocked(queries.createNote).mockResolvedValue({ id: "n1", slug: "two-sum" });
    const res = await createNoteImpl(validNote);
    expect(queries.createNote).toHaveBeenCalledWith(validNote);
    expect(res).toEqual({ ok: true, data: { id: "n1", slug: "two-sum" } });
  });

  it("createNoteImpl maps a conflict", async () => {
    vi.mocked(queries.createNote).mockRejectedValue(new NoteConflictError("dup"));
    expect(await createNoteImpl(validNote)).toEqual({ ok: false, error: "dup" });
  });

  it("updateNoteImpl splits id and forwards the rest (no sectionId)", async () => {
    vi.mocked(queries.updateNote).mockResolvedValue(undefined);
    expect(await updateNoteImpl({ id: "n1", title: "Two Sum II" })).toEqual({ ok: true });
    expect(queries.updateNote).toHaveBeenCalledWith("n1", { title: "Two Sum II" });
  });

  it("deleteNoteImpl maps not-found", async () => {
    vi.mocked(queries.deleteNote).mockRejectedValue(new NoteNotFoundError("n1"));
    expect(await deleteNoteImpl({ id: "n1" })).toEqual({ ok: false, error: "Note n1 not found" });
  });
});

describe("interview schemas", () => {
  it("section requires slug + label", () => {
    expect(() => sectionCreateSchema.parse({ slug: "x", blurb: "", icon: "" })).toThrow();
  });
  it("note requires slug, sectionId, title", () => {
    expect(() => noteCreateSchema.parse({ slug: "x", title: "t" })).toThrow();
  });
  it("note rejects a bad slug", () => {
    expect(() => noteCreateSchema.parse({ ...validNote, slug: "Bad Slug" })).toThrow();
  });
});
