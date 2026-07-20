import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { upsertPage } from "@/db/queries";
import { type ActionResult } from "./_shared";

// Pages are keyed by slug and upserted (insert-or-update); there is no conflict
// or not-found path, so no expected-error mapping is needed here.
export const pageUpsertSchema = z.object({
  slug: z.string().min(1),
  title: z.string().optional(),
  contentMd: z.string().optional(),
});
export type PageUpsertInput = z.infer<typeof pageUpsertSchema>;

export async function upsertPageImpl(input: PageUpsertInput): Promise<ActionResult> {
  const { slug, ...rest } = input;
  await upsertPage(slug, rest);
  return { ok: true };
}

export const upsertPageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => pageUpsertSchema.parse(data))
  .handler(({ data }) => upsertPageImpl(data));
