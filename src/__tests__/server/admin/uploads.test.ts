import { describe, it, expect, vi, beforeEach } from "vitest";
import * as r2 from "@/lib/r2";
import * as queries from "@/db/queries";
import { UploadConflictError } from "@/db/queries";
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

vi.mock("@/db/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/queries")>();
  return { ...actual, recordUpload: vi.fn() };
});

beforeEach(() => vi.clearAllMocks());

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
    expect(queries.recordUpload).toHaveBeenCalledWith(confirmInput);
  });

  it("fails when the object is missing from storage", async () => {
    mockHead(false);
    const res = await confirmUploadImpl(confirmInput);
    expect(res.ok).toBe(false);
    expect(queries.recordUpload).not.toHaveBeenCalled();
  });

  it("maps a duplicate confirm to a failed result", async () => {
    mockHead(true);
    vi.mocked(queries.recordUpload).mockRejectedValue(new UploadConflictError());
    const res = await confirmUploadImpl(confirmInput);
    expect(res.ok).toBe(false);
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
