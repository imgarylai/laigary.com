// @vitest-environment jsdom
//
// The browser side of the 3-step upload (presign → PUT → confirm) shared by the
// cover image, the editor's image dialog and the settings OG image.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uploadFile, getCroppedBlob, compressImage } from "@/lib/upload-client";

const { presignUploadFn, confirmUploadFn, imageCompression } = vi.hoisted(() => ({
  presignUploadFn: vi.fn(),
  confirmUploadFn: vi.fn(),
  imageCompression: vi.fn(),
}));

vi.mock("@/server/admin/uploads", () => ({ presignUploadFn, confirmUploadFn }));
vi.mock("browser-image-compression", () => ({ default: imageCompression }));

const file = new File(["bytes"], "cover.png", { type: "image/png" });

function presignOk() {
  presignUploadFn.mockResolvedValue({
    ok: true,
    data: { id: "u1", r2Key: "uploads/u1.png", uploadUrl: "https://r2.example/put" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});
afterEach(() => vi.unstubAllGlobals());

describe("uploadFile", () => {
  it("should presign, PUT the bytes to storage, then confirm and return the URL", async () => {
    presignOk();
    confirmUploadFn.mockResolvedValue({ ok: true, data: { url: "/uploads/u1.png" } });

    await expect(uploadFile(file)).resolves.toBe("/uploads/u1.png");

    expect(presignUploadFn).toHaveBeenCalledWith({
      data: { filename: "cover.png", contentType: "image/png", sizeBytes: file.size },
    });
    // The bytes go straight to R2, not through the worker.
    const [url, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://r2.example/put");
    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("image/png");
    expect(confirmUploadFn).toHaveBeenCalledWith({
      data: {
        id: "u1",
        r2Key: "uploads/u1.png",
        originalName: "cover.png",
        contentType: "image/png",
        sizeBytes: file.size,
      },
    });
  });

  it("should surface the server's reason when presigning is refused", async () => {
    presignUploadFn.mockResolvedValue({ ok: false, error: "file too large" });

    await expect(uploadFile(file)).rejects.toThrow("file too large");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("should not confirm an upload whose bytes failed to reach storage", async () => {
    presignOk();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(uploadFile(file)).rejects.toThrow("Failed to upload file to storage");
    // Confirming here would record an asset that does not exist.
    expect(confirmUploadFn).not.toHaveBeenCalled();
  });

  it("should surface the server's reason when confirming is refused", async () => {
    presignOk();
    confirmUploadFn.mockResolvedValue({ ok: false, error: "unknown upload" });

    await expect(uploadFile(file)).rejects.toThrow("unknown upload");
  });
});

// Captured once, before any spy is installed. Re-binding inside stubCanvas
// would capture the PREVIOUS test's spy — vi.spyOn returns the existing mock
// when the property is already spied — and calling through would recurse until
// the stack blew.
const realCreateElement = document.createElement.bind(document);

describe("getCroppedBlob", () => {
  /** A stand-in for the <img> the cropper measures, plus a canvas we can watch. */
  function stubCanvas(toBlobResult: Blob | null) {
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob: (cb: (b: Blob | null) => void) => cb(toBlobResult),
    };
    // Scoped to <canvas>. A blanket mockReturnValue hands this stub to every
    // createElement call in the file — including React's, whose failure then
    // points at React rather than here.
    vi.spyOn(document, "createElement").mockImplementation((tag: string) =>
      tag === "canvas" ? (canvas as unknown as HTMLCanvasElement) : realCreateElement(tag),
    );
    return { canvas, drawImage };
  }

  const image = {
    naturalWidth: 1200,
    width: 600,
    naturalHeight: 630,
    height: 315,
  } as HTMLImageElement;
  const crop = { x: 10, y: 20, width: 100, height: 50, unit: "px" as const };

  it("should scale the crop back up to the image's natural size", async () => {
    // The cropper reports coordinates against the displayed size; the export has
    // to happen at full resolution or the cover would be half as sharp.
    const { canvas, drawImage } = stubCanvas(new Blob(["x"], { type: "image/jpeg" }));

    await getCroppedBlob(image, crop);

    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
    expect(drawImage).toHaveBeenCalledWith(image, 20, 40, 200, 100, 0, 0, 200, 100);
  });

  it("should reject rather than resolve an empty blob when the canvas fails", async () => {
    stubCanvas(null);

    await expect(getCroppedBlob(image, crop)).rejects.toThrow("Canvas toBlob failed");
  });
});

describe("compressImage", () => {
  it("should cap the long edge and the file size before uploading", async () => {
    const compressed = new File(["small"], "cover.png", { type: "image/png" });
    imageCompression.mockResolvedValue(compressed);

    await expect(compressImage(file)).resolves.toBe(compressed);
    expect(imageCompression).toHaveBeenCalledWith(file, {
      maxWidthOrHeight: 1920,
      maxSizeMB: 1,
      useWebWorker: true,
    });
  });
});
