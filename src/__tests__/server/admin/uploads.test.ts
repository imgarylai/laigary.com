// @vitest-environment node
//
// The R2 client stays mocked — it is an external service, which is the
// AGENTS.md carve-out — but the upload record goes to the real harness, so a
// double-confirm raises its UNIQUE violation for real instead of being faked.

import { describe, it, expect, vi } from "vitest";
import * as r2 from "@/lib/r2";
import { setupTestDb } from "../../db/helpers/test-db";
import {
  presignUploadImpl,
  confirmUploadImpl,
  presignSchema,
  confirmSchema,
} from "@/server/admin/uploads";

// Provide R2 config on the worker env (the shared stub is empty; confirm needs
// a real base URL for the S3 HEAD request).
vi.mock("cloudflare:workers", () => ({
  env: {
    R2_S3_ENDPOINT: "https://r2.example.com",
    R2_BUCKET_NAME: "test-bucket",
    R2_PUBLIC_URL: "https://assets.example.com",
    R2_ACCESS_KEY_ID: "test-key",
    R2_SECRET_ACCESS_KEY: "test-secret",
  },
}));

// Keep the pure r2 helpers (validateUpload/generateR2Key) real; stub the S3
// client + presign URL. Keep the real UploadConflictError; stub recordUpload.
vi.mock("@/lib/r2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/r2")>();
  return {
    ...actual,
    createR2Client: vi.fn(),
    createPresignedUploadUrl: vi.fn(async () => "https://r2.example/signed-put-url"),
  };
});

const harness = setupTestDb();

/** Rows actually written to the uploads table. */
function recordedIds(): string[] {
  return (harness.sqlite.prepare("SELECT id FROM uploads").all() as { id: string }[]).map(
    (r) => r.id,
  );
}

const validFile = { filename: "photo.png", contentType: "image/png", sizeBytes: 2048 };

describe("presignUploadImpl", () => {
  it("returns a presigned url + generated key for a valid file", async () => {
    vi.mocked(r2.createR2Client).mockReturnValue({} as ReturnType<typeof r2.createR2Client>);
    const res = await presignUploadImpl(validFile);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.uploadUrl).toBe("https://r2.example/signed-put-url");
      expect(res.data.r2Key).toMatch(/^uploads\/\d{4}\/\d{2}\/.+-photo\.png$/);
      expect(res.data.id).toBeTruthy();
    }
  });

  it("rejects a disallowed content type without presigning", async () => {
    const res = await presignUploadImpl({ ...validFile, contentType: "application/zip" });
    expect(res.ok).toBe(false);
    expect(r2.createPresignedUploadUrl).not.toHaveBeenCalled();
  });

  it("rejects an oversized file", async () => {
    const res = await presignUploadImpl({ ...validFile, sizeBytes: 20 * 1024 * 1024 });
    expect(res.ok).toBe(false);
  });
});

const confirmInput = {
  id: "u1",
  r2Key: "uploads/2026/07/u1-photo.png",
  originalName: "photo.png",
  contentType: "image/png",
  sizeBytes: 2048,
};

describe("confirmUploadImpl", () => {
  function mockHead(ok: boolean) {
    vi.mocked(r2.createR2Client).mockReturnValue({
      fetch: vi.fn(async () => ({ ok })),
    } as unknown as ReturnType<typeof r2.createR2Client>);
  }

  it("records the upload and returns its public url when the object exists", async () => {
    mockHead(true);
    const res = await confirmUploadImpl(confirmInput);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.id).toBe("u1");
      expect(res.data.url).toContain(confirmInput.r2Key);
    }
    expect(recordedIds()).toEqual(["u1"]);
  });

  it("fails when the object is missing from storage", async () => {
    mockHead(false);
    const res = await confirmUploadImpl(confirmInput);
    expect(res.ok).toBe(false);
    expect(recordedIds()).toEqual([]);
  });

  it("maps a duplicate confirm to a failed result", async () => {
    // A real UNIQUE violation on r2_key, not a fabricated rejection: confirm
    // the same object twice, which is exactly what a retried request does.
    mockHead(true);
    await confirmUploadImpl(confirmInput);

    const res = await confirmUploadImpl({ ...confirmInput, id: "u2" });

    expect(res).toEqual({ ok: false, error: "Upload already confirmed" });
    expect(recordedIds()).toEqual(["u1"]);
  });

  it("rethrows non-conflict record errors untouched", async () => {
    // Transient storage failure — the sanctioned reason to mock inside the
    // real-DB harness. One insert throws; every other test keeps the real DB.
    mockHead(true);
    vi.spyOn(harness.db, "insert").mockImplementationOnce(() => {
      throw new Error("disk I/O error");
    });

    await expect(confirmUploadImpl(confirmInput)).rejects.toThrow("disk I/O error");
  });
});

describe("upload schemas", () => {
  it("presign requires a positive size", () => {
    expect(() => presignSchema.parse({ ...validFile, sizeBytes: 0 })).toThrow();
  });
  it("confirm requires all fields", () => {
    expect(() => confirmSchema.parse({ id: "u1" })).toThrow();
  });
});
