import { describe, it, expect } from "vitest";
import {
  validateUpload,
  sanitizeFilename,
  generateR2Key,
  createR2Client,
  createPresignedUploadUrl,
} from "@/lib/r2";

describe("validateUpload", () => {
  it("returns null for allowed types under size limit", () => {
    expect(validateUpload("image/png", 1024)).toBeNull();
    expect(validateUpload("image/jpeg", 5 * 1024 * 1024)).toBeNull();
    expect(validateUpload("application/pdf", 100)).toBeNull();
  });

  it("rejects disallowed content types", () => {
    expect(validateUpload("application/exe", 100)).toContain("not allowed");
    expect(validateUpload("text/html", 100)).toContain("not allowed");
  });

  it("rejects files over 10 MB", () => {
    expect(validateUpload("image/png", 11 * 1024 * 1024)).toContain("too large");
  });

  it("accepts files exactly at the limit", () => {
    expect(validateUpload("image/png", 10 * 1024 * 1024)).toBeNull();
  });
});

describe("sanitizeFilename", () => {
  it("lowercases and keeps allowed chars", () => {
    expect(sanitizeFilename("My_File.PNG")).toBe("my_file.png");
  });

  it("replaces unsafe chars with hyphen and collapses runs", () => {
    expect(sanitizeFilename("hello world!! .png")).toBe("hello-world-.png");
  });

  it("strips leading and trailing hyphens", () => {
    expect(sanitizeFilename("--abc--")).toBe("abc");
  });

  it("strips CJK chars (treated as unsafe, then leading hyphens stripped)", () => {
    expect(sanitizeFilename("你好.png")).toBe(".png");
  });
});

describe("generateR2Key", () => {
  it("returns a UUID id and a path under uploads/<year>/<month>/", () => {
    const { id, r2Key } = generateR2Key("photo.jpg");
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r2Key).toMatch(/^uploads\/\d{4}\/\d{2}\/[0-9a-f-]{36}-photo\.jpg$/);
  });

  it("sanitizes the filename in the key", () => {
    const { r2Key } = generateR2Key("Hello World!.PNG");
    expect(r2Key).toMatch(/-hello-world-\.png$/);
  });

  it("returns a fresh id each call", () => {
    const a = generateR2Key("a.png").id;
    const b = generateR2Key("b.png").id;
    expect(a).not.toBe(b);
  });
});

describe("createPresignedUploadUrl", () => {
  it("signs a PUT url carrying bucket, key, expiry and signature", async () => {
    const client = createR2Client({
      R2_S3_ENDPOINT: "https://acc.r2.cloudflarestorage.com",
      R2_ACCESS_KEY_ID: "test-key",
      R2_SECRET_ACCESS_KEY: "test-secret",
    });
    const url = await createPresignedUploadUrl(
      client,
      "https://acc.r2.cloudflarestorage.com",
      "assets",
      "uploads/2026/07/id-photo.png",
      "image/png",
    );
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/assets/uploads/2026/07/id-photo.png");
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(parsed.searchParams.get("X-Amz-Signature")).toBeTruthy();
    expect(parsed.searchParams.get("X-Amz-Credential")).toContain("test-key");
  });
});
