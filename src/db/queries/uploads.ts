import { uploads } from "@/db/schema";
import { getDb } from "./_db";

export class UploadConflictError extends Error {
  constructor(message = "Upload already confirmed") {
    super(message);
    this.name = "UploadConflictError";
  }
}

export type UploadInput = {
  id: string;
  r2Key: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
};

/**
 * Persist a confirmed upload. The r2_key unique constraint guards against a
 * double-confirm; that surfaces as UploadConflictError (driver-agnostic: the
 * D1 and better-sqlite3 drivers both put "UNIQUE" in the thrown message).
 * `uploadedAt` is left to the SQL default.
 */
export async function recordUpload(input: UploadInput): Promise<void> {
  const db = await getDb();
  try {
    await db.insert(uploads).values({
      id: input.id,
      r2Key: input.r2Key,
      originalName: input.originalName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) throw new UploadConflictError();
    throw err;
  }
}
