// @vitest-environment node

import { describe, it, expect } from "vitest";
import { setupTestDb } from "../helpers/test-db";
import { uploads } from "@/db/schema";

const harness = setupTestDb();

const input = {
  id: "u1",
  r2Key: "uploads/2026/07/u1-photo.jpg",
  originalName: "photo.jpg",
  contentType: "image/jpeg",
  sizeBytes: 1234,
};

describe("recordUpload", () => {
  it("inserts an uploads row with a default uploadedAt", async () => {
    const { recordUpload } = await import("@/db/queries");
    await recordUpload(input);

    const rows = await harness.db.select().from(uploads);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "u1",
      r2Key: input.r2Key,
      originalName: "photo.jpg",
      contentType: "image/jpeg",
      sizeBytes: 1234,
    });
    expect(rows[0].uploadedAt).toBeTypeOf("number");
  });

  it("throws UploadConflictError on a duplicate r2Key", async () => {
    const { recordUpload, UploadConflictError } = await import("@/db/queries");
    await recordUpload(input);
    await expect(recordUpload({ ...input, id: "u2" })).rejects.toBeInstanceOf(UploadConflictError);
  });
});

describe("recordUpload branch gaps", () => {
  it("rethrows non-UNIQUE errors untouched", async () => {
    const { recordUpload, UploadConflictError } = await import("@/db/queries");
    const err = await recordUpload({ ...input, id: "u2", r2Key: undefined as never }).catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(UploadConflictError);
  });
});
