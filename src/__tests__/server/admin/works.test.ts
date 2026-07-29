// @vitest-environment node
//
// Admin work mutations against the real better-sqlite3 harness, like the
// sibling posts.test.ts. Every failure these map is one the public API can
// actually produce — a duplicate slug, an unknown id — so none of them are
// faked; the only mock is the transient driver failure AGENTS.md carves out.
//
// The duplicate-slug cases are the guard on EXPECTED_ERROR_NAMES in
// _shared.ts: toFailure matches on the error's `name`, so a WorkConflictError
// missing from that set rethrows and surfaces as a 500 instead of a toast.

import { describe, it, expect, vi } from "vitest";
import { setupTestDb } from "../../db/helpers/test-db";
import { seedWork } from "../../factories";

const harness = setupTestDb();

const validWork = { title: "Hello", slug: "hello", year: 2025 };

describe("createWorkImpl", () => {
  it("writes the work and returns its ref", async () => {
    const { createWorkImpl } = await import("@/server/admin/works");
    const { getAdminWorks } = await import("@/db/queries");

    const res = await createWorkImpl(validWork);

    expect(res).toEqual({ ok: true, data: { id: expect.any(String), slug: "hello" } });
    expect((await getAdminWorks()).items.map((w) => w.slug)).toEqual(["hello"]);
  });

  it("maps a duplicate slug to ok:false", async () => {
    await seedWork({ slug: "hello" });
    const { createWorkImpl } = await import("@/server/admin/works");

    expect(await createWorkImpl(validWork)).toEqual({ ok: false, error: "Slug already exists" });
  });

  it("lets a driver failure propagate rather than reporting it as a failed action", async () => {
    // The one sanctioned mock: a storage-level failure the public API cannot
    // produce. One call throws, every other test here stays on the real DB.
    vi.spyOn(harness.db, "batch").mockImplementationOnce(() => {
      throw new Error("disk I/O error");
    });
    const { createWorkImpl } = await import("@/server/admin/works");

    await expect(createWorkImpl(validWork)).rejects.toThrow("disk I/O error");
  });
});

describe("updateWorkImpl", () => {
  it("applies the edit to the row without passing id through as a field", async () => {
    const { id } = await seedWork({ slug: "old", title: "Old", status: "published" });
    const { updateWorkImpl } = await import("@/server/admin/works");
    const { getWorkBySlug } = await import("@/db/queries");

    const res = await updateWorkImpl({ id, title: "New", slug: "new" });

    expect(res).toEqual({ ok: true, data: { id, slug: "new" } });
    expect((await getWorkBySlug("new"))?.title).toBe("New");
  });

  it("maps an unknown id to ok:false", async () => {
    const { updateWorkImpl } = await import("@/server/admin/works");

    expect(await updateWorkImpl({ id: "missing" })).toEqual({
      ok: false,
      error: "Work missing not found",
    });
  });

  it("maps a slug already taken by another work to ok:false", async () => {
    await seedWork({ slug: "taken" });
    const { id } = await seedWork({ slug: "mine" });
    const { updateWorkImpl } = await import("@/server/admin/works");

    expect(await updateWorkImpl({ id, slug: "taken" })).toEqual({
      ok: false,
      error: "Slug already exists",
    });
  });
});

describe("deleteWorkImpl", () => {
  it("removes the row and returns ok", async () => {
    const { id } = await seedWork({ slug: "doomed" });
    const { deleteWorkImpl } = await import("@/server/admin/works");
    const { getAdminWorks } = await import("@/db/queries");

    expect(await deleteWorkImpl({ id })).toEqual({ ok: true });
    expect((await getAdminWorks()).items).toEqual([]);
  });

  it("maps an unknown id to ok:false", async () => {
    const { deleteWorkImpl } = await import("@/server/admin/works");

    expect(await deleteWorkImpl({ id: "missing" })).toEqual({
      ok: false,
      error: "Work missing not found",
    });
  });
});

describe("work schemas", () => {
  it("accepts a valid work", async () => {
    const { workCreateSchema } = await import("@/server/admin/works");
    expect(() => workCreateSchema.parse(validWork)).not.toThrow();
  });

  it("rejects an invalid slug", async () => {
    const { workCreateSchema } = await import("@/server/admin/works");
    expect(() => workCreateSchema.parse({ ...validWork, slug: "Not A Slug" })).toThrow();
  });

  it("rejects a missing year", async () => {
    const { workCreateSchema } = await import("@/server/admin/works");
    expect(() => workCreateSchema.parse({ title: "Hello", slug: "hello" })).toThrow();
  });

  it("rejects a year outside the accepted range", async () => {
    const { workCreateSchema } = await import("@/server/admin/works");
    expect(() => workCreateSchema.parse({ ...validWork, year: 1969 })).toThrow();
    expect(() => workCreateSchema.parse({ ...validWork, year: 2101 })).toThrow();
  });

  it("accepts a blank project or repo url but rejects a malformed one", async () => {
    // The form submits "" for a field the author never touched; that is not a
    // validation error, it just means "no link". Anything else must be a URL.
    const { workCreateSchema } = await import("@/server/admin/works");
    expect(() =>
      workCreateSchema.parse({ ...validWork, projectUrl: "", repoUrl: "" }),
    ).not.toThrow();
    expect(() => workCreateSchema.parse({ ...validWork, projectUrl: "not-a-url" })).toThrow();
  });

  it("accepts a null endYear so the range can be cleared", async () => {
    const { workUpdateSchema } = await import("@/server/admin/works");
    expect(() => workUpdateSchema.parse({ id: "x", endYear: null })).not.toThrow();
  });

  it("update requires an id", async () => {
    const { workUpdateSchema } = await import("@/server/admin/works");
    expect(() => workUpdateSchema.parse({ title: "Hi" })).toThrow();
  });
});
