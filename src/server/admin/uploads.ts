import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createR2Client, createPresignedUploadUrl, validateUpload, generateR2Key } from "@/lib/r2";
import { recordUpload, UploadConflictError } from "@/db/queries";
import { type ActionResult } from "./_shared";

// R2 config comes off the worker env: three plain vars (endpoint/bucket/public
// url) plus the two presign secrets, which Alchemy injects (alchemy.run.ts).
function r2Env() {
  return env as unknown as {
    R2_S3_ENDPOINT: string;
    R2_BUCKET_NAME: string;
    R2_PUBLIC_URL: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
  };
}

export const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type PresignInput = z.infer<typeof presignSchema>;

export const confirmSchema = z.object({
  id: z.string().min(1),
  r2Key: z.string().min(1),
  originalName: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type ConfirmInput = z.infer<typeof confirmSchema>;

type PresignResult = { id: string; r2Key: string; uploadUrl: string };
type UploadRecord = {
  id: string;
  r2Key: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
};

// Step 1: validate the file, mint an r2Key, and return a presigned PUT URL the
// browser uploads to directly. Content-type is baked into the signature, so the
// client PUT must send the same content-type.
export async function presignUploadImpl(input: PresignInput): Promise<ActionResult<PresignResult>> {
  const validationError = validateUpload(input.contentType, input.sizeBytes);
  if (validationError) return { ok: false, error: validationError };

  const { id, r2Key } = generateR2Key(input.filename);
  const e = r2Env();
  const client = createR2Client(e);
  const uploadUrl = await createPresignedUploadUrl(
    client,
    e.R2_S3_ENDPOINT,
    e.R2_BUCKET_NAME,
    r2Key,
    input.contentType,
  );
  return { ok: true, data: { id, r2Key, uploadUrl } };
}

// Step 3: verify the object actually landed in R2 (S3 HEAD) before recording the
// row, then persist it. Returns the public URL for the stored asset.
export async function confirmUploadImpl(input: ConfirmInput): Promise<ActionResult<UploadRecord>> {
  const e = r2Env();
  const client = createR2Client(e);
  const headUrl = new URL(`/${e.R2_BUCKET_NAME}/${input.r2Key}`, e.R2_S3_ENDPOINT);
  const headRes = await client.fetch(headUrl, { method: "HEAD" });
  if (!headRes.ok) return { ok: false, error: "File not found in storage" };

  try {
    await recordUpload(input);
  } catch (err) {
    if (err instanceof UploadConflictError) return { ok: false, error: err.message };
    throw err;
  }

  return {
    ok: true,
    data: { ...input, url: `${e.R2_PUBLIC_URL}/${input.r2Key}` },
  };
}

export const presignUploadFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => presignSchema.parse(data))
  .handler(({ data }) => presignUploadImpl(data));

export const confirmUploadFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => confirmSchema.parse(data))
  .handler(({ data }) => confirmUploadImpl(data));
