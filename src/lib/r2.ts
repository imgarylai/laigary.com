import { AwsClient } from "aws4fetch";

export function createR2Client(env: {
  R2_S3_ENDPOINT: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}) {
  return new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
}

export async function createPresignedUploadUrl(
  client: AwsClient,
  endpoint: string,
  bucket: string,
  key: string,
  contentType: string,
) {
  const url = new URL(`/${bucket}/${key}`, endpoint);
  url.searchParams.set("X-Amz-Expires", "600");

  const signed = await client.sign(
    new Request(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
    }),
    { aws: { signQuery: true } },
  );

  return signed.url;
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateUpload(contentType: string, sizeBytes: number) {
  if (!ALLOWED_TYPES.has(contentType)) {
    return `File type not allowed: ${contentType}`;
  }
  if (sizeBytes > MAX_FILE_SIZE) {
    return `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
  }
  return null;
}

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateR2Key(filename: string): { id: string; r2Key: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = crypto.randomUUID();
  const safeName = sanitizeFilename(filename);
  return { id, r2Key: `uploads/${year}/${month}/${id}-${safeName}` };
}
