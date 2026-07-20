// Client-side upload helpers shared by the admin upload UIs (cover image,
// editor image dialog, settings OG image). Runs in the browser: it drives the
// 3-step upload via the presign/confirm server functions, crops on a canvas,
// and lazy-loads the image compressor.
import type { PixelCrop } from "react-image-crop";
import { presignUploadFn, confirmUploadFn } from "@/server/admin/uploads";

/**
 * 3-step upload: presign → PUT the bytes straight to R2 → confirm. Returns the
 * public URL of the stored asset. Throws with a user-facing message on failure.
 */
export async function uploadFile(file: File): Promise<string> {
  const presign = await presignUploadFn({
    data: { filename: file.name, contentType: file.type, sizeBytes: file.size },
  });
  if (!presign.ok) throw new Error(presign.error);
  const { id, r2Key, uploadUrl } = presign.data;

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("Failed to upload file to storage");

  const confirm = await confirmUploadFn({
    data: {
      id,
      r2Key,
      originalName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    },
  });
  if (!confirm.ok) throw new Error(confirm.error);
  return confirm.data.url;
}

/** Crop an image element to a PixelCrop region and export a JPEG blob. */
export function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.9,
    );
  });
}

/** Compress an image client-side (max 1920px / 1MB). Lazy-loaded to stay out of SSR. */
export async function compressImage(file: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  return imageCompression(file, {
    maxWidthOrHeight: 1920,
    maxSizeMB: 1,
    useWebWorker: true,
  });
}
