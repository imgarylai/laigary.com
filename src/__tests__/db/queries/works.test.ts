// @vitest-environment node

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { seedTag as seedTagRow, seedWork } from "../../factories";

setupTestDb();

const seedTag = (name: string, slug: string) => seedTagRow({ name, slug });

describe("createWork", () => {
  it("inserts a draft by default with no publishedAt", async () => {
    const { createWork, getAdminWorks } = await import("@/db/queries");
    const { id, slug } = await createWork({ title: "Hello", slug: "hello", year: 2025 });
    expect(id).toBeTruthy();
    expect(slug).toBe("hello");

    const { items } = await getAdminWorks();
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe("draft");
  });

  it("sets publishedAt when status is published", async () => {
    const { createWork, getWorkBySlug } = await import("@/db/queries");
    await createWork({ title: "Live", slug: "live", year: 2025, status: "published" });
    const work = await getWorkBySlug("live");
    // Not merely truthy: an unstamped publishedAt falls back to the epoch.
    expect(work?.date.slice(0, 4)).not.toBe("1970");
  });

  it("defaults summary and contentMd to empty strings", async () => {
    // Both are NOT NULL, so a work created from nothing but a title, slug and
    // year has to land as "" rather than failing the insert.
    const { createWork, getWorkBySlug } = await import("@/db/queries");
    await createWork({ title: "Bare", slug: "bare", year: 2025, status: "published" });
    const work = await getWorkBySlug("bare");
    expect(work?.summary).toBe("");
    expect(work?.contentMd).toBe("");
  });

  it("stores blank optional urls as null rather than empty strings", async () => {
    // The admin form sends "" for a field left untouched. Stored verbatim it
    // would later render as href="" and as an og:image of "".
    const { createWork, getWorkBySlug } = await import("@/db/queries");
    await createWork({
      title: "Site only",
      slug: "site-only",
      year: 2025,
      status: "published",
      projectUrl: "https://example.com",
      repoUrl: "",
      coverImageUrl: "",
      role: "",
    });
    const work = await getWorkBySlug("site-only");
    expect(work?.projectUrl).toBe("https://example.com");
    expect(work?.repoUrl).toBeNull();
    expect(work?.coverImageUrl).toBeNull();
    expect(work?.role).toBeNull();
  });

  it("links tags via work_tags", async () => {
    const { createWork, getWorkBySlug } = await import("@/db/queries");
    const tag = await seedTag("Go", "go");
    await createWork({
      title: "Tagged",
      slug: "tagged",
      year: 2025,
      status: "published",
      tagIds: [tag.id],
    });
    const work = await getWorkBySlug("tagged");
    expect(work?.tags.map((t) => t.slug)).toEqual(["go"]);
  });

  it("throws WorkConflictError on duplicate slug", async () => {
    const { createWork, WorkConflictError } = await import("@/db/queries");
    await createWork({ title: "A", slug: "dup", year: 2025 });
    await expect(createWork({ title: "B", slug: "dup", year: 2024 })).rejects.toBeInstanceOf(
      WorkConflictError,
    );
  });

  it("leaves no orphan row behind when the tag write fails", async () => {
    // Without atomicity the work row is already committed by the time the tag
    // insert fails, so a reported failure still leaves an untagged work.
    const { createWork, getAdminWorks } = await import("@/db/queries");

    await expect(
      createWork({ title: "X", slug: "x", year: 2025, tagIds: ["does-not-exist"] }),
    ).rejects.toThrow();

    const { total } = await getAdminWorks();
    expect(total).toBe(0);
  });

  it("rethrows non-UNIQUE errors untouched", async () => {
    const { createWork, WorkConflictError } = await import("@/db/queries");
    const err = await createWork({
      title: undefined as never,
      slug: "x",
      year: 2025,
    }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(WorkConflictError);
  });
});

describe("updateWork", () => {
  it("updates title and summary while preserving other fields", async () => {
    const { updateWork, getAdminWorkById } = await import("@/db/queries");
    const { id } = await seedWork({ title: "Old", summary: "old", role: "Solo" });
    await updateWork(id, { title: "New", summary: "new" });
    const work = await getAdminWorkById(id);
    expect(work?.title).toBe("New");
    expect(work?.summary).toBe("new");
    expect(work?.role).toBe("Solo");
  });

  it("sets publishedAt when transitioning draft to published", async () => {
    const { updateWork, getWorkBySlug } = await import("@/db/queries");
    const { id, slug } = await seedWork({ status: "draft" });
    expect(await getWorkBySlug(slug)).toBeNull();

    await updateWork(id, { status: "published" });

    const work = await getWorkBySlug(slug);
    expect(work?.date.slice(0, 4)).not.toBe("1970");
  });

  it("keeps the original publishedAt when an already-published work is edited", async () => {
    // Re-stamping on every save would reorder the portfolio on a typo fix.
    const { updateWork, getWorkBySlug } = await import("@/db/queries");
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000_000_000);
    const { id, slug } = await seedWork({ status: "published" });
    const before = (await getWorkBySlug(slug))?.date;

    now.mockReturnValue(2_000_000_000_000);
    await updateWork(id, { title: "Renamed" });
    now.mockRestore();

    expect((await getWorkBySlug(slug))?.date).toBe(before);
  });

  it("clears endYear when explicitly set to null but keeps it when omitted", async () => {
    // `undefined` (field untouched) and `null` (range collapsed to one year)
    // are different edits; conflating them silently drops the end year on any
    // save that doesn't include the control.
    const { updateWork, getAdminWorkById } = await import("@/db/queries");
    const { id } = await seedWork({ year: 2021, endYear: 2023 });

    await updateWork(id, { title: "Renamed" });
    expect((await getAdminWorkById(id))?.endYear).toBe(2023);

    await updateWork(id, { endYear: null });
    expect((await getAdminWorkById(id))?.endYear).toBeNull();
  });

  it("clears an optional field sent as an empty string but keeps it when omitted", async () => {
    // Each of these is an `input.x !== undefined ? input.x || null : existing.x`
    // ternary with three outcomes. The form sends "" to mean "I removed this",
    // so `?? null` instead of `|| null` would store an empty string that later
    // renders as href="" and as an og:image of "".
    const { updateWork, getWorkBySlug } = await import("@/db/queries");
    const { id, slug } = await seedWork({
      projectUrl: "https://example.com",
      repoUrl: "https://github.com/x/y",
      coverImageUrl: "https://cdn.example.com/a.png",
      role: "Solo",
    });

    await updateWork(id, { title: "Renamed" });
    const untouched = await getWorkBySlug(slug);
    expect(untouched?.projectUrl).toBe("https://example.com");
    expect(untouched?.repoUrl).toBe("https://github.com/x/y");
    expect(untouched?.coverImageUrl).toBe("https://cdn.example.com/a.png");
    expect(untouched?.role).toBe("Solo");

    await updateWork(id, { projectUrl: "", repoUrl: "", coverImageUrl: "", role: "" });
    const cleared = await getWorkBySlug(slug);
    expect(cleared?.projectUrl).toBeNull();
    expect(cleared?.repoUrl).toBeNull();
    expect(cleared?.coverImageUrl).toBeNull();
    expect(cleared?.role).toBeNull();
  });

  it("replaces tag links when tagIds is provided", async () => {
    const { updateWork, getWorkBySlug } = await import("@/db/queries");
    const tagA = await seedTag("A", "a");
    const tagB = await seedTag("B", "b");
    const { id, slug } = await seedWork({ tagIds: [tagA.id] });

    await updateWork(id, { tagIds: [tagB.id] });

    expect((await getWorkBySlug(slug))?.tags.map((t) => t.slug)).toEqual(["b"]);
  });

  it("clears every tag when tagIds is empty", async () => {
    const { updateWork, getWorkBySlug } = await import("@/db/queries");
    const tagA = await seedTag("A", "a");
    const { id, slug } = await seedWork({ tagIds: [tagA.id] });

    await updateWork(id, { tagIds: [] });

    expect((await getWorkBySlug(slug))?.tags).toEqual([]);
  });

  it("leaves pinned unchanged when the update omits it", async () => {
    const { updateWork, getAdminWorkById } = await import("@/db/queries");
    const { id } = await seedWork({ pinned: true });
    await updateWork(id, { title: "Renamed" });
    expect((await getAdminWorkById(id))?.pinned).toBe(true);
  });

  it("throws WorkNotFoundError for unknown id", async () => {
    const { updateWork, WorkNotFoundError } = await import("@/db/queries");
    await expect(updateWork("missing", { title: "x" })).rejects.toBeInstanceOf(WorkNotFoundError);
  });

  it("throws WorkConflictError when the new slug is taken", async () => {
    const { updateWork, WorkConflictError } = await import("@/db/queries");
    await seedWork({ slug: "taken" });
    const { id } = await seedWork({ slug: "free" });
    await expect(updateWork(id, { slug: "taken" })).rejects.toBeInstanceOf(WorkConflictError);
  });

  it("leaves the row and its tags untouched when the tag write fails", async () => {
    // The row update, the tag delete and the tag insert are one unit. Without
    // atomicity the caller sees an error while the work has already been
    // renamed and stripped of every tag — the original set unrecoverable.
    const { updateWork, getWorkBySlug } = await import("@/db/queries");
    const tag = await seedTag("Go", "go");
    const { id, slug } = await seedWork({ title: "Original", tagIds: [tag.id] });

    await expect(
      updateWork(id, { title: "Renamed", tagIds: ["does-not-exist"] }),
    ).rejects.toThrow();

    const after = await getWorkBySlug(slug);
    expect(after?.title).toBe("Original");
    expect(after?.tags.map((t) => t.slug)).toEqual(["go"]);
  });
});

describe("deleteWork", () => {
  it("removes the work and its tag links", async () => {
    const { deleteWork, getAdminWorks } = await import("@/db/queries");
    const tag = await seedTag("Go", "go");
    const { id } = await seedWork({ tagIds: [tag.id] });

    await deleteWork(id);

    expect((await getAdminWorks()).total).toBe(0);
    // The tag itself survives — only the link cascades.
    const { getAllTags } = await import("@/db/queries");
    expect(await getAllTags()).toHaveLength(1);
  });

  it("throws WorkNotFoundError for unknown id", async () => {
    const { deleteWork, WorkNotFoundError } = await import("@/db/queries");
    await expect(deleteWork("missing")).rejects.toBeInstanceOf(WorkNotFoundError);
  });
});

describe("getPublishedWorks", () => {
  it("orders pinned first, then by year descending", async () => {
    // Seeded in an order that VIOLATES the expected one — the unpinned newest
    // first and the pinned oldest last. A fixture already in the right order
    // cannot tell a working ORDER BY from no ORDER BY at all.
    const { getPublishedWorks } = await import("@/db/queries");
    await seedWork({ slug: "newest", year: 2026 });
    await seedWork({ slug: "middle", year: 2022 });
    await seedWork({ slug: "pinned-oldest", year: 2019, pinned: true });

    const { works } = await getPublishedWorks();
    expect(works.map((w) => w.slug)).toEqual(["pinned-oldest", "newest", "middle"]);
  });

  it("hides drafts", async () => {
    const { getPublishedWorks } = await import("@/db/queries");
    await seedWork({ status: "draft" });
    expect((await getPublishedWorks()).total).toBe(0);
  });

  it("filters by tag slug", async () => {
    const { getPublishedWorks } = await import("@/db/queries");
    const a = await seedTag("A", "a");
    const b = await seedTag("B", "b");
    await seedWork({ slug: "w1", tagIds: [a.id] });
    await seedWork({ slug: "w2", tagIds: [b.id] });

    const onlyA = await getPublishedWorks({ tag: "a" });
    expect(onlyA.works.map((w) => w.slug)).toEqual(["w1"]);
  });

  it("returns empty for an unknown tag", async () => {
    const { getPublishedWorks } = await import("@/db/queries");
    expect(await getPublishedWorks({ tag: "nope" })).toEqual({ works: [], total: 0 });
  });

  it("respects limit and offset", async () => {
    const { getPublishedWorks } = await import("@/db/queries");
    await seedWork({ slug: "w2020", year: 2020 });
    await seedWork({ slug: "w2024", year: 2024 });
    await seedWork({ slug: "w2022", year: 2022 });

    const page1 = await getPublishedWorks({ limit: 2, offset: 0 });
    const page2 = await getPublishedWorks({ limit: 2, offset: 2 });
    // Exact slices, not just "the pages differ" — that stays true even if
    // offset is ignored and the rows come back in insertion order.
    expect(page1.works.map((w) => w.slug)).toEqual(["w2024", "w2022"]);
    expect(page2.works.map((w) => w.slug)).toEqual(["w2020"]);
    expect(page1.total).toBe(3);
  });
});

describe("getWorkBySlug", () => {
  it("returns the full record for a published work", async () => {
    const { getWorkBySlug } = await import("@/db/queries");
    await seedWork({
      slug: "full",
      title: "Full",
      summary: "one liner",
      contentMd: "# case study",
      projectUrl: "https://example.com",
      role: "Solo",
      year: 2021,
      endYear: 2023,
    });

    expect(await getWorkBySlug("full")).toMatchObject({
      slug: "full",
      title: "Full",
      summary: "one liner",
      contentMd: "# case study",
      projectUrl: "https://example.com",
      repoUrl: null,
      role: "Solo",
      year: 2021,
      endYear: 2023,
    });
  });

  it("returns null for a draft and for an unknown slug", async () => {
    const { getWorkBySlug } = await import("@/db/queries");
    const { slug } = await seedWork({ status: "draft" });
    expect(await getWorkBySlug(slug)).toBeNull();
    expect(await getWorkBySlug("nope")).toBeNull();
  });
});

describe("getAdminWorks", () => {
  it("filters by title substring", async () => {
    const { getAdminWorks } = await import("@/db/queries");
    await seedWork({ title: "Hello world", slug: "hw" });
    await seedWork({ title: "Goodbye", slug: "gb" });
    const r = await getAdminWorks({ q: "hello" });
    expect(r.items.map((w) => w.slug)).toEqual(["hw"]);
  });

  it("filters by status", async () => {
    const { getAdminWorks } = await import("@/db/queries");
    await seedWork({ slug: "d", status: "draft" });
    await seedWork({ slug: "p", status: "published" });
    const drafts = await getAdminWorks({ status: "draft" });
    expect(drafts.items.map((w) => w.slug)).toEqual(["d"]);
  });
});

describe("getAllAdminWorks", () => {
  it("includes drafts and surfaces year and pinned", async () => {
    const { getAllAdminWorks } = await import("@/db/queries");
    await seedWork({ slug: "draft", status: "draft", year: 2024, pinned: true });
    await seedWork({ slug: "live", status: "published", year: 2025 });

    const rows = await getAllAdminWorks();
    expect(rows).toHaveLength(2);
    expect(rows.find((w) => w.slug === "draft")).toMatchObject({ year: 2024, pinned: true });
    expect(rows.find((w) => w.slug === "live")).toMatchObject({ year: 2025, pinned: false });
  });
});

describe("getAdminWorkById", () => {
  it("returns editable fields plus tagIds for any status", async () => {
    const { getAdminWorkById } = await import("@/db/queries");
    const tag = await seedTag("Go", "go");
    const { id } = await seedWork({
      slug: "t",
      title: "T",
      status: "draft",
      repoUrl: "https://github.com/x/y",
      tagIds: [tag.id],
    });

    const work = await getAdminWorkById(id);
    expect(work).toMatchObject({
      id,
      title: "T",
      slug: "t",
      status: "draft",
      repoUrl: "https://github.com/x/y",
    });
    expect(work?.tagIds).toEqual([tag.id]);
  });

  it("returns null for a missing id", async () => {
    const { getAdminWorkById } = await import("@/db/queries");
    expect(await getAdminWorkById("nope")).toBeNull();
  });
});
