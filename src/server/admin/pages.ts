import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toFailure, type ActionResult } from "./_shared";

// Pages are keyed by slug and upserted (insert-or-update), so the upsert has no
// conflict or not-found path. Delete does: the slug may already be gone.
export const pageUpsertSchema = z.object({
  slug: z.string().min(1),
  title: z.string().optional(),
  contentMd: z.string().optional(),
});
export type PageUpsertInput = z.infer<typeof pageUpsertSchema>;

export const pageSlugSchema = z.object({ slug: z.string().min(1) });

export async function upsertPageImpl(input: PageUpsertInput): Promise<ActionResult> {
  const { slug, ...rest } = input;
  // Dynamic import keeps the D1 query layer out of the client bundle (the page
  // form imports this server function).
  const { upsertPage } = await import("@/db/queries");
  await upsertPage(slug, rest);
  return { ok: true };
}

export async function deletePageImpl(input: { slug: string }): Promise<ActionResult> {
  try {
    const { deletePage } = await import("@/db/queries");
    await deletePage(input.slug);
    return { ok: true };
  } catch (err) {
    return toFailure(err);
  }
}

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const upsertPageFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => pageUpsertSchema.parse(data))
  .handler(({ data }) => upsertPageImpl(data));
/* v8 ignore stop */

/* v8 ignore start -- RPC boundary, unreachable under vitest (see AGENTS.md). */
export const deletePageFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => pageSlugSchema.parse(data))
  .handler(({ data }) => deletePageImpl(data));
/* v8 ignore stop */
