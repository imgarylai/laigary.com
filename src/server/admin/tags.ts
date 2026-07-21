import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toFailure, type ActionResult } from "./_shared";

// Queries are loaded via dynamic import inside each Impl (never a static
// top-level import) so these client-imported server functions don't pull the
// D1/`cloudflare:workers` query modules into the client bundle.

export const tagCreateSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
});
export type TagCreateInput = z.infer<typeof tagCreateSchema>;

// Only the name is mutable — a tag's slug is immutable by design in the query.
export const tagUpdateSchema = z.object({ id: z.string().min(1), name: z.string().min(1) });
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;

export const tagIdSchema = z.object({ id: z.string().min(1) });

export async function createTagImpl(input: TagCreateInput): Promise<ActionResult> {
  try {
    const { createTag } = await import("@/db/queries");
    await createTag(input);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export async function updateTagImpl(input: TagUpdateInput): Promise<ActionResult> {
  try {
    const { updateTag } = await import("@/db/queries");
    await updateTag(input.id, { name: input.name });
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deleteTagImpl(input: { id: string }): Promise<ActionResult> {
  try {
    const { deleteTag } = await import("@/db/queries");
    await deleteTag(input.id);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export const createTagFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => tagCreateSchema.parse(data))
  .handler(({ data }) => createTagImpl(data));

export const updateTagFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => tagUpdateSchema.parse(data))
  .handler(({ data }) => updateTagImpl(data));

export const deleteTagFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => tagIdSchema.parse(data))
  .handler(({ data }) => deleteTagImpl(data));
