import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toFailure, type ActionResult } from "./_shared";

// The query layer is loaded via dynamic import inside each Impl (never a static
// top-level import) so these client-imported server functions don't pull the
// D1/`cloudflare:workers` query modules into the client bundle.

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens");
const title = z.string().min(1).max(255);
// The form submits "" for a URL field the author left alone, which is not the
// same as an invalid URL — accept it and let the query layer store null.
const optionalUrl = z.union([z.literal(""), z.url()]).optional();
const year = z.number().int().min(1970).max(2100);

export const workCreateSchema = z.object({
  title,
  slug,
  summary: z.string().optional(),
  contentMd: z.string().optional(),
  coverImageUrl: z.string().optional(),
  projectUrl: optionalUrl,
  repoUrl: optionalUrl,
  role: z.string().optional(),
  year,
  // `nullable` as well as `optional`: null clears the end year, undefined
  // leaves whatever is stored alone.
  endYear: year.nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  pinned: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
export type WorkCreateInput = z.infer<typeof workCreateSchema>;

// Update accepts a full or partial work (the query does a partial update). id
// identifies the row; every content field is optional.
export const workUpdateSchema = z.object({
  id: z.string().min(1),
  title: title.optional(),
  slug: slug.optional(),
  summary: z.string().optional(),
  contentMd: z.string().optional(),
  coverImageUrl: z.string().optional(),
  projectUrl: optionalUrl,
  repoUrl: optionalUrl,
  role: z.string().optional(),
  year: year.optional(),
  endYear: year.nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  pinned: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
export type WorkUpdateInput = z.infer<typeof workUpdateSchema>;

export const workIdSchema = z.object({ id: z.string().min(1) });

type WorkRef = { id: string; slug: string };

// Impl functions hold the mutation + error-mapping logic and are unit-tested
// against the real query layer; the createServerFn wrappers below are the thin
// validated RPC boundary the admin forms call.
export async function createWorkImpl(input: WorkCreateInput): Promise<ActionResult<WorkRef>> {
  try {
    const { createWork } = await import("@/db/queries");
    return { ok: true, data: await createWork(input) };
  } catch (err) {
    return toFailure(err);
  }
}

export async function updateWorkImpl(input: WorkUpdateInput): Promise<ActionResult<WorkRef>> {
  const { id, ...rest } = input;
  try {
    const { updateWork } = await import("@/db/queries");
    return { ok: true, data: await updateWork(id, rest) };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deleteWorkImpl(input: { id: string }): Promise<ActionResult> {
  try {
    const { deleteWork } = await import("@/db/queries");
    await deleteWork(input.id);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const createWorkFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => workCreateSchema.parse(data))
  .handler(({ data }) => createWorkImpl(data));
/* v8 ignore stop */

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const updateWorkFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => workUpdateSchema.parse(data))
  .handler(({ data }) => updateWorkImpl(data));
/* v8 ignore stop */

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const deleteWorkFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => workIdSchema.parse(data))
  .handler(({ data }) => deleteWorkImpl(data));
/* v8 ignore stop */
