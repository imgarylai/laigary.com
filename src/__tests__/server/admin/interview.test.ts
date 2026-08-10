// @vitest-environment node
//
// Admin section/note mutations against the real better-sqlite3 harness, mirror
// of posts.test.ts. AGENTS.md mandates posts <-> notes parity and the source
// honours it; these tests used to cover the opposite branch from the posts file
// for all four verbs, so each side looked complete from inside its own describe
// while the pair had complementary holes. Both halves now exist on both sides.

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";
import { seedNote, seedSection } from "../../factories";

const harness = setupTestDb();

const validSection = { slug: "leetcode", label: "LeetCode", blurb: "", icon: "code" };

const section = () => seedSection({ slug: "leetcode", label: "LeetCode" });

describe("createSectionImpl", () => {
  it("writes the section and returns its ref", async () => {
    const { createSectionImpl } = await import("@/server/admin/interview");
    const { getInterviewSections } = await import("@/db/queries");

    const res = await createSectionImpl(validSection);

    expect(res).toEqual({ ok: true, data: { id: expect.any(String), slug: "leetcode" } });
    expect((await getInterviewSections()).map((s) => s.slug)).toEqual(["leetcode"]);
  });

  it("maps a duplicate slug to ok:false", async () => {
    await section();
    const { createSectionImpl } = await import("@/server/admin/interview");

    expect(await createSectionImpl(validSection)).toEqual({
      ok: false,
      error: "Section slug already exists",
    });
  });
});

describe("updateSectionImpl", () => {
  it("applies the edit to the row without passing id through as a field", async () => {
    const { id } = await section();
    const { updateSectionImpl } = await import("@/server/admin/interview");
    const { getInterviewSectionBySlug } = await import("@/db/queries");

    expect(await updateSectionImpl({ id, label: "LC" })).toEqual({ ok: true });
    expect((await getInterviewSectionBySlug("leetcode"))?.label).toBe("LC");
  });

  it("maps an unknown id to ok:false", async () => {
    const { updateSectionImpl } = await import("@/server/admin/interview");

    expect(await updateSectionImpl({ id: "missing", label: "LC" })).toEqual({
      ok: false,
      error: "Section missing not found",
    });
  });
});

describe("deleteSectionImpl", () => {
  it("removes the row and returns ok", async () => {
    const { id } = await section();
    const { deleteSectionImpl } = await import("@/server/admin/interview");
    const { getInterviewSections } = await import("@/db/queries");

    expect(await deleteSectionImpl({ id })).toEqual({ ok: true });
    expect(await getInterviewSections()).toEqual([]);
  });

  it("maps an unknown id to ok:false", async () => {
    const { deleteSectionImpl } = await import("@/server/admin/interview");

    expect(await deleteSectionImpl({ id: "missing" })).toEqual({
      ok: false,
      error: "Section missing not found",
    });
  });
});

describe("createNoteImpl", () => {
  it("writes the note and returns its ref", async () => {
    const { id: sectionId } = await section();
    const { createNoteImpl } = await import("@/server/admin/interview");
    const { getInterviewNote } = await import("@/db/queries");

    const res = await createNoteImpl({
      slug: "two-sum",
      sectionId,
      title: "Two Sum",
      status: "published",
    });

    expect(res).toEqual({ ok: true, data: { id: expect.any(String), slug: "two-sum" } });
    expect((await getInterviewNote("leetcode", "two-sum"))?.title).toBe("Two Sum");
  });

  it("maps a slug already used in the same section to ok:false", async () => {
    const { id: sectionId } = await section();
    await seedNote(sectionId, { slug: "two-sum" });
    const { createNoteImpl } = await import("@/server/admin/interview");

    expect(await createNoteImpl({ slug: "two-sum", sectionId, title: "Dup" })).toEqual({
      ok: false,
      error: "Note slug already exists in this section",
    });
  });

  it("lets a driver failure propagate rather than reporting it as a failed action", async () => {
    const { id: sectionId } = await section();
    vi.spyOn(harness.db, "batch").mockImplementationOnce(() => {
      throw new Error("disk I/O error");
    });
    const { createNoteImpl } = await import("@/server/admin/interview");

    await expect(createNoteImpl({ slug: "n", sectionId, title: "N" })).rejects.toThrow(
      "disk I/O error",
    );
  });
});

describe("updateNoteImpl", () => {
  it("applies the edit to the row without passing id through as a field", async () => {
    const { id: sectionId } = await section();
    const { id } = await seedNote(sectionId, { slug: "n", title: "Old", status: "published" });
    const { updateNoteImpl } = await import("@/server/admin/interview");
    const { getInterviewNote } = await import("@/db/queries");

    expect(await updateNoteImpl({ id, title: "Two Sum II" })).toEqual({ ok: true });
    expect((await getInterviewNote("leetcode", "n"))?.title).toBe("Two Sum II");
  });

  it("maps an unknown id to ok:false", async () => {
    const { updateNoteImpl } = await import("@/server/admin/interview");

    expect(await updateNoteImpl({ id: "missing", title: "x" })).toEqual({
      ok: false,
      error: "Note missing not found",
    });
  });

  it("maps a slug already taken in the section to ok:false", async () => {
    const { id: sectionId } = await section();
    await seedNote(sectionId, { slug: "taken" });
    const { id } = await seedNote(sectionId, { slug: "mine" });
    const { updateNoteImpl } = await import("@/server/admin/interview");

    expect(await updateNoteImpl({ id, slug: "taken" })).toEqual({
      ok: false,
      error: "Note slug already exists in this section",
    });
  });

  it("moves the note to the section it is given", async () => {
    const { id: sectionId } = await section();
    const { id: targetId } = await seedSection({ slug: "system-design", label: "System Design" });
    const { id } = await seedNote(sectionId, { slug: "n", status: "published" });
    const { updateNoteImpl } = await import("@/server/admin/interview");
    const { getInterviewNote } = await import("@/db/queries");

    expect(await updateNoteImpl({ id, sectionId: targetId })).toEqual({ ok: true });
    expect(await getInterviewNote("leetcode", "n")).toBeNull();
    expect(await getInterviewNote("system-design", "n")).not.toBeNull();
  });

  it("maps a move onto a slug the target section already uses to ok:false", async () => {
    const { id: sectionId } = await section();
    const { id: targetId } = await seedSection({ slug: "system-design", label: "System Design" });
    await seedNote(targetId, { slug: "n" });
    const { id } = await seedNote(sectionId, { slug: "n" });
    const { updateNoteImpl } = await import("@/server/admin/interview");

    expect(await updateNoteImpl({ id, sectionId: targetId })).toEqual({
      ok: false,
      error: "Note slug already exists in this section",
    });
  });
});

describe("deleteNoteImpl", () => {
  it("removes the row and returns ok", async () => {
    const { id: sectionId } = await section();
    const { id } = await seedNote(sectionId, { slug: "doomed", status: "published" });
    const { deleteNoteImpl } = await import("@/server/admin/interview");
    const { getInterviewNotesBySection } = await import("@/db/queries");

    expect(await deleteNoteImpl({ id })).toEqual({ ok: true });
    expect((await getInterviewNotesBySection("leetcode")).total).toBe(0);
  });

  it("maps an unknown id to ok:false", async () => {
    const { deleteNoteImpl } = await import("@/server/admin/interview");

    expect(await deleteNoteImpl({ id: "missing" })).toEqual({
      ok: false,
      error: "Note missing not found",
    });
  });
});

describe("interview schemas", () => {
  it("section requires slug + label", async () => {
    const { sectionCreateSchema } = await import("@/server/admin/interview");
    expect(() => sectionCreateSchema.parse({ slug: "x", blurb: "", icon: "" })).toThrow();
  });

  it("note requires slug, sectionId, title", async () => {
    const { noteCreateSchema } = await import("@/server/admin/interview");
    expect(() => noteCreateSchema.parse({ slug: "x", title: "t" })).toThrow();
  });

  it("note rejects a bad slug", async () => {
    const { noteCreateSchema } = await import("@/server/admin/interview");
    expect(() =>
      noteCreateSchema.parse({ slug: "Bad Slug", sectionId: "s1", title: "T" }),
    ).toThrow();
  });

  it("note update keeps sectionId — moving a note between sections is allowed", async () => {
    const { noteUpdateSchema } = await import("@/server/admin/interview");

    const parsed = noteUpdateSchema.parse({ id: "n1", sectionId: "s2", title: "T" });

    expect(parsed).toEqual({ id: "n1", sectionId: "s2", title: "T" });
  });

  it("note update rejects an empty sectionId rather than silently keeping the old one", async () => {
    const { noteUpdateSchema } = await import("@/server/admin/interview");

    expect(() => noteUpdateSchema.parse({ id: "n1", sectionId: "" })).toThrow();
  });

  it("section update drops slug, matching what updateSection can actually set", async () => {
    const { sectionUpdateSchema } = await import("@/server/admin/interview");

    const parsed = sectionUpdateSchema.parse({ id: "s1", slug: "renamed", label: "L" });

    expect(parsed).toEqual({ id: "s1", label: "L" });
    expect(parsed).not.toHaveProperty("slug");
  });
});
