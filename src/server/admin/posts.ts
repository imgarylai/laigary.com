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

export const postCreateSchema = z.object({
  title,
  slug,
  contentMd: z.string().min(1),
  excerpt: z.string().optional(),
  coverImageUrl: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  pinned: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
export type PostCreateInput = z.infer<typeof postCreateSchema>;

// Update accepts a full or partial post (the query does a partial update). id
// identifies the row; every content field is optional.
export const postUpdateSchema = z.object({
  id: z.string().min(1),
  title: title.optional(),
  slug: slug.optional(),
  contentMd: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  coverImageUrl: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  pinned: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;

export const postIdSchema = z.object({ id: z.string().min(1) });

type PostRef = { id: string; slug: string };

// Impl functions hold the mutation + error-mapping logic and are unit-tested
// with the query layer mocked; the createServerFn wrappers below are the thin
// validated RPC boundary the admin forms call.
export async function createPostImpl(input: PostCreateInput): Promise<ActionResult<PostRef>> {
  try {
    const { createPost } = await import("@/db/queries");
    return { ok: true, data: await createPost(input) };
  } catch (err) {
    return toFailure(err);
  }
}

export async function updatePostImpl(input: PostUpdateInput): Promise<ActionResult<PostRef>> {
  const { id, ...rest } = input;
  try {
    const { updatePost } = await import("@/db/queries");
    return { ok: true, data: await updatePost(id, rest) };
  } catch (err) {
    return toFailure(err);
  }
}

export async function deletePostImpl(input: { id: string }): Promise<ActionResult> {
  try {
    const { deletePost } = await import("@/db/queries");
    await deletePost(input.id);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

export const createPostFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => postCreateSchema.parse(data))
  .handler(({ data }) => createPostImpl(data));

export const updatePostFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => postUpdateSchema.parse(data))
  .handler(({ data }) => updatePostImpl(data));

export const deletePostFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => postIdSchema.parse(data))
  .handler(({ data }) => deletePostImpl(data));
